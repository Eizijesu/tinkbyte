// scripts/sync-content.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to ensure author exists
async function ensureAuthor(authorSlug, authorData = {}) {
  if (!authorSlug) {
    console.log('⚠️  No author slug provided, using default');
    authorSlug = 'tinkbyte-team';
  }

  try {
    // Check if author exists
    const { data: existingAuthor, error: findError } = await supabase
      .from('authors')
      .select('*')
      .eq('slug', authorSlug)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error(`❌ Error checking author ${authorSlug}:`, findError.message);
      return 'tinkbyte-team';
    }

    if (existingAuthor) {
      return existingAuthor.slug;
    }

    // Auto-create author if doesn't exist
    const authorDefaults = {
      slug: authorSlug,
      name: authorData.name || authorSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      bio: authorData.bio || `Author at TinkByte`,
      avatar: authorData.avatar || '/images/default-avatar.png',
      role: authorData.role || 'Contributor',
      company: authorData.company || null,
      email: authorData.email || null,
      social: authorData.social || {},
      featured: authorData.featured || false,
      follower_count: 0,
      article_count: 0,
      is_verified: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newAuthor, error: createError } = await supabase
      .from('authors')
      .insert(authorDefaults)
      .select()
      .single();

    if (createError) {
      console.error(`❌ Error creating author ${authorSlug}:`, createError.message);
      return 'tinkbyte-team';
    }

    console.log(`✅ Auto-created author: ${newAuthor.name} (${newAuthor.slug})`);
    return newAuthor.slug;

  } catch (error) {
    console.error(`❌ Error ensuring author ${authorSlug}:`, error.message);
    return 'tinkbyte-team';
  }
}

async function syncAuthors() {
  console.log('🔄 Syncing authors...');
  
  const authorFiles = getMarkdownFiles('src/content/authors');
  
  for (const filePath of authorFiles) {
    try {
      const { data, content } = readMarkdownFile(filePath);
      const slug = path.basename(filePath, path.extname(filePath));
      
      const authorData = {
        slug,
        name: data.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        bio: data.bio || '',
        avatar: data.avatar || '/images/default-avatar.png',
        role: data.role || 'Contributor',
        company: data.company || null,
        email: data.email || null,
        social: data.social || {},
        featured: data.featured || false,
        follower_count: 0,
        article_count: 0,
        is_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('authors')
        .upsert(authorData, { onConflict: 'slug' });
      
      if (error) {
        console.error(`❌ Error with author ${data.name}:`, error.message);
      } else {
        console.log(`✅ Synced author: ${authorData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
}

async function syncCategories() {
  console.log('🔄 Syncing categories...');
  
  const categoryFiles = getMarkdownFiles('src/content/categories');
  
  for (const filePath of categoryFiles) {
    try {
      const { data } = readMarkdownFile(filePath);
      const slug = path.basename(filePath, path.extname(filePath));
      
      const categoryData = {
        name: data.name,
        slug: slug,
        description: data.description,
        color: data.color || 'blue',
        icon: data.icon || 'tag',
        is_premium: data.premium || false,
        // Only include columns that exist
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.sortOrder !== undefined && { sort_order: data.sortOrder }),
        ...(data.tags && { tags: data.tags }),
        ...(data.seo?.title && { seo_title: data.seo.title }),
        ...(data.seo?.description && { seo_description: data.seo.description }),
      };
      
      const { error } = await supabase
        .from('categories')
        .upsert(categoryData, { onConflict: 'slug' });
      
      if (error) {
        console.error(`❌ Error with category ${data.name}:`, error.message);
      } else {
        console.log(`✅ Synced: ${data.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
}

async function syncArticles() {
  console.log('🔄 Syncing articles...');
  
  const blogFiles = getMarkdownFiles('src/content/blog');
  
  for (const filePath of blogFiles) {
    try {
      const { data, content } = readMarkdownFile(filePath);
      const slug = path.basename(filePath, path.extname(filePath));
      
      if (data.draft) {
        console.log(`⏭️  Skipping draft: ${data.title}`);
        continue;
      }
      
      // Handle author - support your TinaCMS structure
      let authorSlug;
      let authorData = {};
      
      if (data.authorInfo) {
        // Extract author info from your TinaCMS structure
        const authorName = data.authorInfo.name;
        
        // Convert author name to slug
        if (authorName) {
          authorSlug = authorName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '');
          
          // Store author data for auto-creation
          authorData = {
            name: authorName,
            bio: data.authorInfo.bio || '',
            avatar: data.authorInfo.avatar || '/images/default-avatar.png',
            role: data.authorInfo.role || 'Contributor'
          };
        }
      }
      
      // Support legacy author formats
      if (!authorSlug && data.author_slug) {
        authorSlug = data.author_slug;
      }
      
      if (!authorSlug && data.author_id) {
        authorSlug = data.author_id;
      }
      
      if (!authorSlug && data.author) {
        if (typeof data.author === 'string') {
          authorSlug = data.author;
        } else if (data.author.slug) {
          authorSlug = data.author.slug;
        }
      }
      
      // Fallback to default if no author info
      if (!authorSlug) {
        authorSlug = 'tinkbyte-team';
      }

      // Ensure author exists (auto-create if needed)
      const validAuthorSlug = await ensureAuthor(authorSlug, authorData);

      // Ensure category exists
      const categorySlug = data.category || 'general';
      const { data: categoryExists } = await supabase
        .from('categories')
        .select('slug')
        .eq('slug', categorySlug)
        .single();

      if (!categoryExists) {
        console.log(`⚠️  Category ${categorySlug} not found, creating default`);
        await supabase
          .from('categories')
          .insert({
            slug: categorySlug,
            name: categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: `Auto-created category for ${categorySlug}`,
            color: 'blue',
            icon: 'tag',
            is_premium: false,
            featured: false,
            sort_order: 0,
            created_at: new Date().toISOString()
          });
      }
      
      // Get image URL
      let imageUrl = null;
      if (data.heroImage?.uploadedImage) {
        imageUrl = data.heroImage.uploadedImage;
      } else if (data.heroImage?.externalUrl) {
        imageUrl = data.heroImage.externalUrl;
      } else if (data.image) {
        imageUrl = data.image;
      }
      
      const articleData = {
        slug: slug,
        title: data.title,
        subtitle: data.subtitle || null,
        excerpt: data.excerpt,
        content: content,
        author_id: validAuthorSlug, // Now references authors.slug
        category_slug: categorySlug,
        featured_image_url: imageUrl,
        is_published: !data.draft,
        is_premium: data.premium || false,
        is_featured: data.featured || false,
        read_time_minutes: calculateReadTime(data.readTime, content),
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        published_at: data.pubDate ? new Date(data.pubDate).toISOString() : new Date().toISOString(),
        created_at: data.pubDate ? new Date(data.pubDate).toISOString() : new Date().toISOString(),
        updated_at: data.updatedDate ? new Date(data.updatedDate).toISOString() : new Date().toISOString(),
        is_deleted: false,
      };
      
      const { error } = await supabase
        .from('articles')
        .upsert(articleData, { onConflict: 'slug' });
      
      if (error) {
        console.error(`❌ Error with article ${data.title}:`, error.message);
        console.error('Data:', articleData);
      } else {
        console.log(`✅ Synced: ${data.title}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
}

// Update author stats
async function updateAuthorStats() {
  console.log('🔄 Updating author stats...');
  
  try {
    const { data: authors, error: authorsError } = await supabase
      .from('authors')
      .select('slug');

    if (authorsError) {
      console.error('❌ Error fetching authors:', authorsError.message);
      return;
    }

    for (const author of authors) {
      const { count, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', author.slug)
        .eq('is_published', true)
        .eq('is_deleted', false);

      if (countError) {
        console.error(`❌ Error counting articles for ${author.slug}:`, countError.message);
        continue;
      }

      const { error: updateError } = await supabase
        .from('authors')
        .update({ article_count: count })
        .eq('slug', author.slug);

      if (updateError) {
        console.error(`❌ Error updating stats for ${author.slug}:`, updateError.message);
      } else {
        console.log(`✅ Updated stats for author ${author.slug}: ${count} articles`);
      }
    }
  } catch (error) {
    console.error('❌ Error updating author stats:', error.message);
  }
}

function readMarkdownFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return matter(fileContent);
}

function getMarkdownFiles(dirPath) {
  try {
    return fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .map(file => path.join(dirPath, file));
  } catch (error) {
    console.log(`Directory ${dirPath} not found`);
    return [];
  }
}

function calculateReadTime(readTimeString, content) {
  if (readTimeString) {
    const match = readTimeString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 5;
  }
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

async function main() {
  console.log('🚀 Starting sync...\n');

  try {
    await syncAuthors();
    console.log('');
    
    await syncCategories();
    console.log('');
    
    await syncArticles();
    console.log('');
    
    await updateAuthorStats();
    console.log('');
    
    const { count: authorsCount } = await supabase
      .from('authors')
      .select('*', { count: 'exact', head: true });
    
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    
    const { count: articlesCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    console.log('✅ Sync completed!');
    console.log(`📊 Results:`);
    console.log(`   • ${authorsCount} authors`);
    console.log(`   • ${categoriesCount} categories`);
    console.log(`   • ${articlesCount} articles`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

main();