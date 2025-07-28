// src/pages/rss/[category].xml.ts - UPDATED
import rss from '@astrojs/rss';
import { getPostsByCategory, getCategoryName, getCategoryColor } from '../../utils/content';
import { SITE, getAllCategories } from '../../config/site';
import type { APIRoute } from 'astro';

export async function getStaticPaths() {
  const categories = getAllCategories();
  
  return categories.map(category => ({
    params: { category: category.slug },
    props: { 
      categoryName: category.name,
      categoryDescription: category.description,
      categoryColor: category.color
    }
  }));
}

export const GET: APIRoute = async (context) => {
  try {
    const { category } = context.params;
    const { categoryName, categoryDescription } = context.props;
    const posts = await getPostsByCategory(category as any);
    
    return rss({
      title: `${SITE.name} - ${categoryName}`,
      description: `${categoryDescription} | ${SITE.description}`,
      site: context.site?.toString() || SITE.url,
      items: posts.map((post) => ({
        title: post.data.title,
        pubDate: new Date(post.data.pubDate),
        description: post.data.excerpt || post.data.subtitle || '',
        link: `/blog/${post.slug}/`,
        categories: [categoryName, ...(post.data.tags || [])],
        customData: `
          <category>${categoryName}</category>
          ${post.data.storyType ? `<storyType>${post.data.storyType}</storyType>` : ''}
          ${post.data.featured ? '<featured>true</featured>' : ''}
        `
      })),
      customData: `
        <language>en-us</language>
        <category>${categoryName}</category>
        <description>${categoryDescription}</description>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      `,
    });
  } catch (error) {
    console.error(`RSS Feed Generation Error for category ${context.params.category}:`, error);
    return new Response('Error generating category RSS feed', { status: 500 });
  }
};