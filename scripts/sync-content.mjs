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

// Collection mappings
const COLLECTIONS = {
  authors: 'src/content/authors',
  blog: 'src/content/blog',
  categories: 'src/content/categories',
  allTopics: 'src/content/allTopics',
  contact: 'src/content/contact',
  legal: 'src/content/legal',
  newsletter: 'src/content/newsletter',
  pages: 'src/content/pages',
  podcast: 'src/content/podcast',
  settings: 'src/content/settings'
};

// Helper function to ensure author exists
async function ensureAuthor(authorSlug, authorData = {}) {
  if (!authorSlug) {
    console.log('⚠️  No author slug provided, using default');
    authorSlug = 'tinkbyte-team';
  }

  try {
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

// Sync Authors
async function syncAuthors() {
  console.log('🔄 Syncing authors...');
  
  const authorFiles = getMarkdownFiles(COLLECTIONS.authors);
  
  for (const filePath of authorFiles) {
    try {
      const { data, content } = readMarkdownFile(filePath);
      const slug = path.basename(filePath, path.extname(filePath));
      
      const authorData = {
        slug,
        name: data.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        bio: data.bio || content.substring(0, 200) + '...',
        avatar: data.avatar || '/images/default-avatar.png',
        role: data.role || 'Contributor',
        company: data.company || null,
        email: data.email || null,
        social: data.social || {},
        featured: data.featured || false,
        follower_count: data.follower_count || 0,
        article_count: 0, // Will be updated later
        is_verified: data.verified || false,
        is_active: data.active !== false,
        created_at: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
        updated_at: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString()
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

// Sync Categories
async function syncCategories() {
  console.log('🔄 Syncing categories...');
  
  const categoryFiles = getMarkdownFiles(COLLECTIONS.categories);
  
  for (const filePath of categoryFiles) {
    try {
      const { data, content } = readMarkdownFile(filePath);
      const slug = path.basename(filePath, path.extname(filePath));
      
      const categoryData = {
        name: data.name,
        slug: slug,
        description: data.description || content.substring(0, 200) + '...',
        target_audience: data.audience || data.targetAudience || null,
        color: data.color || 'blue',
        icon: data.icon || 'tag',
        is_premium: data.premium || false,
        sort_order: data.sortOrder || 0,
        is_featured: data.featured || false,
        tags: data.tags || [],
        seo_title: data.seo?.title || null,
        seo_description: data.seo?.description || null,
        newsletter_enabled: data.newsletter?.enabled || false,
        created_at: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('categories')
        .upsert(categoryData, { onConflict: 'slug' });
      
      if (error) {
        console.error(`❌ Error with category ${data.name}:`, error.message);
      } else {
        console.log(`✅ Synced category: ${data.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
}

// Sync All Topics (if different from categories)
async function syncAllTopics() {
  console.log('🔄 Syncing all topics...');
  
  const topicFiles = getMarkdownFiles(COLLECTIONS.allTopics);
  
  if (topicFiles.length === 0) {
    console.log('ℹ️  No topic files found, skipping...');
    return;
  }
  
  for (const filePath of topicFiles) {
    try {
      const { data, content } = readMarkdownFile(filePath);
      const slug = path.basename(filePath, path.extname(filePath));
      
      // You might want to create a separate topics table or merge with categories
      // For now, I'll treat them as categories
      const topicData = {
        name: data.name || data.title,
        slug: slug,
        description: data.description || content.substring(0, 200) + '...',
        color: data.color || 'gray',
        icon: data.icon || 'hashtag',
        is_premium: false,
        sort_order: data.sortOrder || 999,
        is_featured: false,
        tags: data.tags || [],
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('categories')
        .upsert(topicData, { onConflict: 'slug' });
      
      if (error) {
        console.error(`❌ Error with topic ${data.name}:`, error.message);
      } else {
        console.log(`✅ Synced topic: ${topicData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
}

// UPDATED: Sync Blog Articles - Now handles drafts properly
async function syncArticles() {
  console.log('🔄 Syncing articles...');
  
  const blogFiles = getMarkdownFiles(COLLECTIONS.blog);
  
  for (const filePath of blogFiles) {
    try {
      const { data, content } = readMarkdownFile(filePath);
      const slug = path.basename(filePath, path.extname(filePath));
      
      // 🔥 FIXED: Don't skip drafts, sync them with correct publication status
      const isDraft = data.draft === true;
      const isPublished = !isDraft;
      
      console.log(`📝 Processing: ${data.title} (${isDraft ? 'DRAFT' : 'PUBLISHED'})`);
      
      // Handle author - support your TinaCMS structure
      let authorSlug;
      let authorData = {};
      
      if (data.authorInfo) {
        const authorName = data.authorInfo.name;
        if (authorName) {
          authorSlug = authorName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '');
          
          authorData = {
            name: authorName,
            bio: data.authorInfo.bio || '',
            avatar: data.authorInfo.avatar || '/images/default-avatar.png',
            role: data.authorInfo.role || 'Contributor'
          };
        }
      }
      
      // Support legacy author formats
      if (!authorSlug && data.author_slug) authorSlug = data.author_slug;
      if (!authorSlug && data.author_id) authorSlug = data.author_id;
      if (!authorSlug && data.author) {
        if (typeof data.author === 'string') {
          authorSlug = data.author;
        } else if (data.author.slug) {
          authorSlug = data.author.slug;
        }
      }
      
      if (!authorSlug) authorSlug = 'tinkbyte-team';

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
            is_featured: false,
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
        excerpt: data.excerpt || data.description || content.substring(0, 200) + '...',
        content: content,
        author_id: validAuthorSlug,
        category_slug: categorySlug,
        featured_image_url: imageUrl,
        is_published: isPublished, // 🔥 FIXED: Properly set publication status
        is_premium: data.premium || false,
        is_featured: data.featured || false,
        read_time_minutes: calculateReadTime(data.readTime, content),
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        published_at: isPublished && data.pubDate ? new Date(data.pubDate).toISOString() : null, // Only set if published
        created_at: data.pubDate ? new Date(data.pubDate).toISOString() : new Date().toISOString(),
        updated_at: data.updatedDate ? new Date(data.updatedDate).toISOString() : new Date().toISOString(),
        is_deleted: false,
      };
      
      const { error } = await supabase
        .from('articles')
        .upsert(articleData, { onConflict: 'slug' });
      
      if (error) {
        console.error(`❌ Error with article ${data.title}:`, error.message);
      } else {
        console.log(`✅ Synced article: ${data.title} (${isPublished ? 'Published' : 'Draft'})`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
}

// UPDATED: Sync Podcasts - Also handle draft status
async function syncPodcasts() {
  console.log('🔄 Syncing podcasts...');
  
  const podcastFiles = getMarkdownFiles(COLLECTIONS.podcast);
  
  if (podcastFiles.length === 0) {
    console.log('ℹ️  No podcast files found, skipping...');
    return;
  }
  
  for (const filePath of podcastFiles) {
    try {
      const { data, content } = readMarkdownFile(filePath);
      const slug = path.basename(filePath, path.extname(filePath));
      
      const isDraft = data.draft === true || data.status === 'draft';
      const isPublished = !isDraft;
      
      console.log(`🎙️ Processing podcast: ${data.title} (${isDraft ? 'DRAFT' : 'PUBLISHED'})`);
      
      const podcastData = {
        slug: slug,
        title: data.title,
        description: data.description || content.substring(0, 300) + '...',
        duration: data.duration || null,
        audio_url: data.audioUrl || data.audio_url || null,
        image_url: data.imageUrl || data.image_url || data.image || null,
        episode_number: data.episodeNumber || data.episode_number || data.episode || null,
        season_number: data.seasonNumber || data.season_number || null,
        published_at: isPublished && data.pubDate ? new Date(data.pubDate).toISOString() : null,
        is_published: isPublished, // 🔥 FIXED: Properly handle draft status
        featured: data.featured || false,
        created_at: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
        updated_at: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('podcasts')
        .upsert(podcastData, { onConflict: 'slug' });
      
      if (error) {
        console.error(`❌ Error with podcast ${data.title}:`, error.message);
      } else {
        console.log(`✅ Synced podcast: ${data.title} (${isPublished ? 'Published' : 'Draft'})`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
}

// Sync Newsletter Subscriptions (if you have newsletter content)
async function syncNewsletters() {
  console.log('🔄 Syncing newsletters...');
  
  const newsletterFiles = getMarkdownFiles(COLLECTIONS.newsletter);
  
  if (newsletterFiles.length === 0) {
    console.log('ℹ️  No newsletter files found, skipping...');
    return;
  }
  
  for (const filePath of newsletterFiles) {
    try {
      const { data, content } = readMarkdownFile(filePath);
      const slug = path.basename(filePath, path.extname(filePath));
      
      const newsletterData = {
        slug: slug,
        name: data.name || data.title,
        description: data.description || content.substring(0, 200) + '...',
        frequency: data.frequency || 'weekly',
        day_of_week: data.dayOfWeek || null,
        image_url: data.imageUrl || data.image || null,
        code: data.code || null,
        type: data.type || 'general',
        is_active: data.active !== false,
        sort_order: data.sortOrder || 0,
        subscriber_count: 0,
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('newsletters')
        .upsert(newsletterData, { onConflict: 'slug' });
      
      if (error) {
        console.error(`❌ Error with newsletter ${data.name}:`, error.message);
      } else {
        console.log(`✅ Synced newsletter: ${data.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
}

// UPDATED: Update author stats - Only count published articles
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
      // 🔥 FIXED: Only count published articles for stats
      const { count, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', author.slug)
        .eq('is_published', true) // Only published articles
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
        console.log(`✅ Updated stats for author ${author.slug}: ${count} published articles`);
      }
    }
  } catch (error) {
    console.error('❌ Error updating author stats:', error.message);
  }
}

// NEW: Function to clean up orphaned articles (articles that no longer exist in markdown)
async function cleanupOrphanedArticles() {
  console.log('🧹 Cleaning up orphaned articles...');
  
  try {
    // Get all article slugs from database
    const { data: dbArticles, error: dbError } = await supabase
      .from('articles')
      .select('slug')
      .eq('is_deleted', false);

    if (dbError) {
      console.error('❌ Error fetching database articles:', dbError.message);
      return;
    }

    // Get all markdown file slugs
    const blogFiles = getMarkdownFiles(COLLECTIONS.blog);
    const markdownSlugs = new Set(
      blogFiles.map(filePath => path.basename(filePath, path.extname(filePath)))
    );

    // Find orphaned articles
    const orphanedArticles = dbArticles.filter(article => !markdownSlugs.has(article.slug));

    if (orphanedArticles.length === 0) {
      console.log('✅ No orphaned articles found');
      return;
    }

    console.log(`🗑️  Found ${orphanedArticles.length} orphaned articles`);

    for (const orphan of orphanedArticles) {
      const { error } = await supabase
        .from('articles')
        .update({ 
          is_deleted: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('slug', orphan.slug);

      if (error) {
        console.error(`❌ Error marking ${orphan.slug} as deleted:`, error.message);
      } else {
        console.log(`🗑️  Marked as deleted: ${orphan.slug}`);
      }
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

// Helper functions
function readMarkdownFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return matter(fileContent);
}

function getMarkdownFiles(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
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

// UPDATED: Main function with cleanup
async function main() {
  console.log('🚀 Starting comprehensive sync...\n');

  try {
    // Sync in order of dependencies
    await syncAuthors();
    console.log('');
    
    await syncCategories();
    console.log('');
    
    await syncAllTopics();
    console.log('');
    
    await syncArticles(); // 🔥 Now properly handles drafts
    console.log('');
    
    await syncPodcasts(); // 🔥 Now properly handles drafts
    console.log('');
    
    await syncNewsletters();
    console.log('');
    
    await updateAuthorStats(); // 🔥 Only counts published articles
    console.log('');
    
    await cleanupOrphanedArticles(); // 🔥 NEW: Clean up deleted articles
    console.log('');
    
    // Get final counts
    const { count: authorsCount } = await supabase
      .from('authors')
      .select('*', { count: 'exact', head: true });
    
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    
    const { count: articlesCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    const { count: publishedCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('is_deleted', false);

    const { count: draftCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', false)
      .eq('is_deleted', false);
    
    const { count: podcastsCount } = await supabase
      .from('podcasts')
      .select('*', { count: 'exact', head: true });
    
    const { count: newslettersCount } = await supabase
      .from('newsletters')
      .select('*', { count: 'exact', head: true });
    
    console.log('✅ Comprehensive sync completed!');
    console.log(`📊 Final Results:`);
    console.log(`   • ${authorsCount} authors`);
    console.log(`   • ${categoriesCount} categories/topics`);
    console.log(`   • ${articlesCount} total articles (${publishedCount} published, ${draftCount} drafts)`);
    console.log(`   • ${podcastsCount} podcasts`);
    console.log(`   • ${newslettersCount} newsletters`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

main();