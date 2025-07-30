// src/pages/rss/[category].xml.ts - COMPLETE FIXED VERSION
import rss from '@astrojs/rss';
import { getPostsByCategory } from '../../utils/content';
import { SITE, getAllCategories } from '../../config/site';
import type { APIRoute } from 'astro';

// Add interface for category
interface CategoryInfo {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export async function getStaticPaths() {
  try {
    const categories = getAllCategories();
    
    return categories.map((category: CategoryInfo) => ({
      params: { category: category.slug },
      props: { 
        categoryName: category.name,
        categoryDescription: category.description || `Latest articles in ${category.name}`,
        categoryColor: category.color
      }
    }));
  } catch (error) {
    console.error('Error generating static paths for category RSS:', error);
    return [];
  }
}

export const GET: APIRoute = async (context) => {
  try {
    const { category } = context.params;
    
    if (!category) {
      return new Response('Category parameter is required', { status: 400 });
    }

    const { categoryName, categoryDescription } = context.props;
    
    // Get posts for this category
    const posts = await getPostsByCategory(category);
    
    if (!posts || posts.length === 0) {
      console.warn(`No posts found for category: ${category}`);
    }

    const feedItems = posts.map((post: any) => {
      // Ensure we have a valid date
      const pubDate = post.data.pubDate ? new Date(post.data.pubDate) : new Date();
      
      return {
        title: post.data.title,
        pubDate,
        description: post.data.excerpt || post.data.subtitle || `Read more about ${post.data.title}`,
        link: `/blog/${post.slug}/`,
        categories: [categoryName, ...(post.data.tags || [])],
        customData: `
          <category>${categoryName}</category>
          ${post.data.storyType ? `<storyType><![CDATA[${post.data.storyType}]]></storyType>` : ''}
          ${post.data.featured ? '<featured>true</featured>' : ''}
          ${post.data.author ? `<author><![CDATA[${post.data.author}]]></author>` : ''}
        `.trim()
      };
    });

    return rss({
      title: `${SITE.name} - ${categoryName}`,
      description: `${categoryDescription} | ${SITE.description}`,
      site: context.site?.toString() || SITE.url,
      items: feedItems,
      customData: `
        <language>en-us</language>
        <category><![CDATA[${categoryName}]]></category>
        <description><![CDATA[${categoryDescription}]]></description>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <generator>Astro with TinaCMS</generator>
        <managingEditor>${SITE.author || 'editor@tinkbyte.com'} (${SITE.name})</managingEditor>
        <webMaster>webmaster@tinkbyte.com (${SITE.name})</webMaster>
        <ttl>60</ttl>
      `.trim(),
    });
  } catch (error: any) {
    console.error(`RSS Feed Generation Error for category ${context.params.category}:`, error);
    
    // ✅ FIXED: Safe environment check
    const isDev = import.meta.env?.DEV || false;
    const errorMessage = isDev 
      ? `Error generating category RSS feed: ${error.message}` 
      : 'Error generating category RSS feed';
    
    return new Response(errorMessage, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
};