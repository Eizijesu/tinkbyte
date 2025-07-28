// src/pages/atom.xml.ts - NEW Atom Feed
import { getPublishedPosts, getAuthorInfo, getHeroImage } from '../utils/content';
import { SITE } from '../config/site';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  try {
    const posts = await getPublishedPosts();
    const baseUrl = context.site?.toString() || SITE.url;
    const now = new Date().toISOString();

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${SITE.title}</title>
  <subtitle>${SITE.description}</subtitle>
  <link href="${baseUrl}/atom.xml" rel="self"/>
  <link href="${baseUrl}"/>
  <updated>${now}</updated>
  <id>${baseUrl}/</id>
  <author>
    <name>${SITE.name}</name>
    <email>${SITE.social.email}</email>
    <uri>${baseUrl}</uri>
  </author>
  <generator uri="https://astro.build/" version="5.0">Astro</generator>
  <icon>${baseUrl}${SITE.favicon}</icon>
  <logo>${baseUrl}${SITE.logo}</logo>
  <rights>Copyright ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</rights>
  ${posts.slice(0, 20).map((post) => {
    const authorInfo = getAuthorInfo(post);
    const heroImage = getHeroImage(post);
    const updated = post.data.updatedDate 
      ? new Date(post.data.updatedDate).toISOString()
      : new Date(post.data.pubDate).toISOString();
    
    return `
  <entry>
    <title type="html">${post.data.title}</title>
    <link href="${baseUrl}/blog/${post.slug}/"/>
    <id>${baseUrl}/blog/${post.slug}/</id>
    <published>${new Date(post.data.pubDate).toISOString()}</published>
    <updated>${updated}</updated>
    <author>
      <name>${authorInfo.name}</name>
    </author>
    <summary type="html">${post.data.excerpt}</summary>
    <content type="html">${post.data.excerpt}</content>
    <category term="${post.data.category}" label="${post.data.category}"/>
    ${(post.data.tags || []).map(tag => `<category term="${tag}" label="${tag}"/>`).join('')}
    ${post.data.storyType ? `<category term="${post.data.storyType}" label="Story Type: ${post.data.storyType}"/>` : ''}
    ${heroImage ? `<link rel="enclosure" href="${heroImage.src}" type="image/jpeg"/>` : ''}
  </entry>`;
  }).join('')}
</feed>`.trim();

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/atom+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Atom Feed Generation Error:', error);
    return new Response('Error generating Atom feed', { status: 500 });
  }
};