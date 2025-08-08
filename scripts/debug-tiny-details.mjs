import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_KEY
);

async function debugTinyDetails() {
  const filePath = 'src/content/blog/tiny-details-make-difference.mdx';
  
  console.log('🔍 Step 1: Checking file...');
  console.log('File exists:', fs.existsSync(filePath));
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found!');
    return;
  }
  
  // Parse the file
  const { data, content } = matter(fs.readFileSync(filePath, 'utf8'));
  const slug = path.basename(filePath, path.extname(filePath));
  
  console.log('\n📋 Step 2: File Analysis:');
  console.log('Slug:', slug);
  console.log('Title:', data.title);
  console.log('Draft:', data.draft);
  console.log('Is Published (calculated):', !data.draft);
  console.log('Category:', data.category);
  console.log('PubDate:', data.pubDate);
  console.log('Author Name:', data.authorInfo?.name);
  
  // Check if article exists in database
  console.log('\n🔍 Step 3: Checking database...');
  const { data: existing, error: existError } = await supabase
    .from('articles')
    .select('slug, title, is_published, is_deleted, created_at, author_id')
    .eq('slug', slug)
    .single();
    
  if (existError && existError.code !== 'PGRST116') {
    console.log('❌ Database error:', existError);
  } else if (existing) {
    console.log('✅ Article EXISTS in database:');
    console.log('  Title:', existing.title);
    console.log('  Published:', existing.is_published);
    console.log('  Deleted:', existing.is_deleted);
    console.log('  Created:', existing.created_at);
    console.log('  Author ID:', existing.author_id);
  } else {
    console.log('❌ Article NOT FOUND in database');
  }
  
  // Check author exists
  console.log('\n🔍 Step 4: Checking author...');
  const authorName = data.authorInfo?.name || 'Eiza';
  const expectedAuthorSlug = authorName.toLowerCase().replace(/\s+/g, '-');
  
  const { data: author, error: authorError } = await supabase
    .from('authors')
    .select('slug, name')
    .eq('slug', expectedAuthorSlug)
    .single();
    
  if (authorError && authorError.code !== 'PGRST116') {
    console.log('❌ Author query error:', authorError);
  } else if (author) {
    console.log('✅ Author EXISTS:', author.name, `(${author.slug})`);
  } else {
    console.log('❌ Author NOT FOUND:', expectedAuthorSlug);
  }
  
  // Check category exists
  console.log('\n🔍 Step 5: Checking category...');
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('slug, name')
    .eq('slug', data.category)
    .single();
    
  if (categoryError && categoryError.code !== 'PGRST116') {
    console.log('❌ Category query error:', categoryError);
  } else if (category) {
    console.log('✅ Category EXISTS:', category.name, `(${category.slug})`);
  } else {
    console.log('❌ Category NOT FOUND:', data.category);
  }
  
  // Show recent sync activity
  console.log('\n📊 Step 6: Recent articles in database:');
  const { data: recentArticles } = await supabase
    .from('articles')
    .select('slug, title, created_at, is_published')
    .order('created_at', { ascending: false })
    .limit(5);
    
  recentArticles?.forEach(article => {
    console.log(`  - ${article.title} (${article.slug}) - ${article.is_published ? 'Published' : 'Draft'}`);
  });
}

debugTinyDetails().catch(console.error);