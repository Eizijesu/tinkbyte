// src/pages/rss.xml.ts - Using external site configuration
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

// Import your site configuration
// Adjust the import path based on your actual config file location
import { SITE } from '../config/site.ts';

export const GET: APIRoute = async (context) => {
  try {
    const posts = await getCollection('blog', ({ data }) => {
      return !data.draft;
    });

    const sortedPosts = posts.sort((a, b) => {
      const dateA = new Date(a.data.pubDate).getTime();
      const dateB = new Date(b.data.pubDate).getTime();
      return dateB - dateA;
    });

    return rss({
      title: SITE.title,
      description: SITE.description,
      site: context.site?.toString() || SITE.url,
      items: sortedPosts.map((post) => ({
        title: post.data.title,
        pubDate: new Date(post.data.pubDate),
        description: post.data.excerpt || post.data.description || '',
        link: `/blog/${post.slug}/`,
        author: post.data.author || 'TinkByte Team',
        categories: post.data.tags || [],
        guid: `/blog/${post.slug}/`,
      })),
      customData: `
        <language>en-us</language>
        <managingEditor>hello@tinkbyte.com (TinkByte Editorial Team)</managingEditor>
        <webMaster>hello@tinkbyte.com (TinkByte Technical Team)</webMaster>
        <copyright>Copyright ${new Date().getFullYear()} TinkByte. All rights reserved.</copyright>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <generator>Astro with TinkByte CMS</generator>
      `,
    });
  } catch (error) {
    console.error('RSS Feed Generation Error:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
};