// src/pages/rss.xml.ts - ENHANCED VERSION WITH BETTER ERROR HANDLING
import rss from '@astrojs/rss';
import { getPublishedPosts, getAuthorInfo } from '../utils/content';
import { SITE } from '../config/site';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  try {
    
    
    const posts = await getPublishedPosts();
    
    if (!posts || posts.length === 0) {
      console.warn('⚠️ No published posts found for RSS feed');
    }

    const feedItems = posts.map((post) => {
      try {
        const authorInfo = getAuthorInfo(post);
        
        // Ensure we have a valid publication date
        const pubDate = post.data.pubDate ? new Date(post.data.pubDate) : new Date();
        
        // Sanitize content for XML
        const sanitizeForXML = (text: string) => {
          return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        };

        return {
          title: post.data.title,
          pubDate,
          description: post.data.excerpt || post.data.subtitle || `Read more about ${post.data.title}`,
          link: `/blog/${post.slug}/`,
          author: `${SITE.social?.email || 'feedback@tinkbyte.com'} (${authorInfo.name})`,
          categories: [
            post.data.category,
            ...(post.data.tags || []),
            post.data.storyType || 'article'
          ].filter(Boolean),
          guid: `/blog/${post.slug}/`,
          
          customData: `
            <content:encoded><![CDATA[${post.data.excerpt || post.data.subtitle || ''}]]></content:encoded>
            <dc:creator><![CDATA[${authorInfo.name}]]></dc:creator>
            <category><![CDATA[${post.data.category || 'Uncategorized'}]]></category>
            ${post.data.storyType ? `<storyType><![CDATA[${post.data.storyType}]]></storyType>` : ''}
            ${post.data.featured ? '<featured>true</featured>' : ''}
            ${post.data.hasAudio && post.data.audioUrl ? `<enclosure url="${post.data.audioUrl}" type="audio/mpeg" length="0" />` : ''}
            ${post.data.readTime ? `<readTime>${post.data.readTime}</readTime>` : ''}
            ${post.data.featuredImage ? `<featuredImage><![CDATA[${post.data.featuredImage}]]></featuredImage>` : ''}
          `.trim()
        };
      } catch (itemError) {
        console.error(`Error processing post ${post.slug} for RSS:`, itemError);
        // Return a minimal item to prevent the entire feed from failing
        return {
          title: post.data.title || 'Untitled Post',
          pubDate: new Date(post.data.pubDate || Date.now()),
          description: 'Content temporarily unavailable',
          link: `/blog/${post.slug}/`,
          guid: `/blog/${post.slug}/`,
        };
      }
    });

    const feedConfig = {
      title: SITE.title,
      description: SITE.description,
      site: context.site?.toString() || SITE.url,
      
      // XML namespaces
      xmlns: {
        content: 'http://purl.org/rss/1.0/modules/content/',
        dc: 'http://purl.org/dc/elements/1.1/',
        atom: 'http://www.w3.org/2005/Atom',
        media: 'http://search.yahoo.com/mrss/'
      },
      
      items: feedItems,
      
      customData: `
        <language>en-us</language>
        <managingEditor><![CDATA[${SITE.social?.email || 'feedback@tinkbyte.com'} (TinkByte Editorial Team)]]></managingEditor>
        <webMaster><![CDATA[${SITE.social?.email || 'feedback@tinkbyte.com'} (TinkByte Technical Team)]]></webMaster>
        <copyright><![CDATA[Copyright ${new Date().getFullYear()} TinkByte. All rights reserved.]]></copyright>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <pubDate>${new Date().toUTCString()}</pubDate>
        <generator>Astro with TinaCMS</generator>
        <docs>https://www.rssboard.org/rss-specification</docs>
        <ttl>60</ttl>
        <updatePeriod>hourly</updatePeriod>
        <updateFrequency>1</updateFrequency>
        <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
        ${SITE.defaultImage ? `
        <image>
          <url>${SITE.url}${SITE.defaultImage}</url>
          <title><![CDATA[${SITE.title}]]></title>
          <link>${SITE.url}</link>
          <width>144</width>
          <height>144</height>
          <description><![CDATA[${SITE.title} Logo]]></description>
        </image>
        ` : ''}
      `.trim(),
    };

    
    
    return rss(feedConfig);
    
  } catch (error: any) {
    console.error('❌ RSS Feed Generation Error:', error);
    
    // In development, return more detailed error info
    const isDev = import.meta.env.DEV;
    const errorMessage = isDev 
      ? `RSS Feed Error: ${error.message}\n\nStack: ${error.stack}` 
      : 'Error generating RSS feed';
    
    return new Response(errorMessage, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
};