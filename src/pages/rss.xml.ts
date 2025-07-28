// src/pages/rss.xml.ts - UPDATED for your schema
import rss from '@astrojs/rss';
import { getPublishedPosts, getAuthorInfo } from '../utils/content';
import { SITE } from '../config/site';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  try {
    const posts = await getPublishedPosts();

    return rss({
      title: SITE.title,
      description: SITE.description,
      site: context.site?.toString() || SITE.url,
      items: posts.map((post) => {
        const authorInfo = getAuthorInfo(post);
        
        return {
          title: post.data.title,
          pubDate: new Date(post.data.pubDate),
          description: post.data.excerpt || post.data.subtitle || '',
          link: `/blog/${post.slug}/`,
          author: `${SITE.social.email} (${authorInfo.name})`,
          categories: [
            post.data.category,
            ...(post.data.tags || []),
            post.data.storyType || 'article'
          ].filter(Boolean),
          guid: `/blog/${post.slug}/`,
          // Enhanced RSS with custom elements
          customData: `
            <content:encoded><![CDATA[${post.data.excerpt}]]></content:encoded>
            <dc:creator>${authorInfo.name}</dc:creator>
            <category>${post.data.category}</category>
            ${post.data.storyType ? `<storyType>${post.data.storyType}</storyType>` : ''}
            ${post.data.featured ? '<featured>true</featured>' : ''}
            ${post.data.hasAudio ? `<audio>${post.data.audioUrl}</audio>` : ''}
            ${post.data.readTime ? `<readTime>${post.data.readTime}</readTime>` : ''}
          `
        };
      }),
      customData: `
        <language>en-us</language>
        <managingEditor>${SITE.social.email} (TinkByte Editorial Team)</managingEditor>
        <webMaster>${SITE.social.email} (TinkByte Technical Team)</webMaster>
        <copyright>Copyright ${new Date().getFullYear()} TinkByte. All rights reserved.</copyright>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <generator>Astro with TinaCMS</generator>
        <docs>https://www.rssboard.org/rss-specification</docs>
        <ttl>60</ttl>
        <image>
          <url>${SITE.url}${SITE.defaultImage}</url>
          <title>${SITE.title}</title>
          <link>${SITE.url}</link>
          <width>144</width>
          <height>144</height>
        </image>
      `,
    });
  } catch (error) {
    console.error('RSS Feed Generation Error:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
};