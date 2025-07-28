// src/pages/feed.json.ts - NEW JSON Feed
import { getPublishedPosts, getAuthorInfo, getHeroImage } from '../utils/content';
import { SITE } from '../config/site';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  try {
    const posts = await getPublishedPosts();
    const baseUrl = context.site?.toString() || SITE.url;

    const feed = {
      version: "https://jsonfeed.org/version/1.1",
      title: SITE.title,
      home_page_url: baseUrl,
      feed_url: `${baseUrl}/feed.json`,
      description: SITE.description,
      icon: `${baseUrl}${SITE.favicon}`,
      favicon: `${baseUrl}${SITE.favicon}`,
      language: SITE.locale,
      authors: [
        {
          name: SITE.name,
          url: baseUrl,
          avatar: `${baseUrl}${SITE.logo}`
        }
      ],
      items: posts.slice(0, 20).map((post) => {
        const authorInfo = getAuthorInfo(post);
        const heroImage = getHeroImage(post);
        
        return {
          id: `${baseUrl}/blog/${post.slug}/`,
          url: `${baseUrl}/blog/${post.slug}/`,
          title: post.data.title,
          content_html: post.data.excerpt,
          content_text: post.data.excerpt,
          summary: post.data.subtitle || post.data.excerpt,
          image: heroImage?.src,
          banner_image: heroImage?.src,
          date_published: new Date(post.data.pubDate).toISOString(),
          date_modified: post.data.updatedDate 
            ? new Date(post.data.updatedDate).toISOString() 
            : new Date(post.data.pubDate).toISOString(),
          authors: [
            {
              name: authorInfo.name,
              avatar: authorInfo.avatar
            }
          ],
          tags: [
            post.data.category,
            ...(post.data.tags || []),
            ...(post.data.storyType ? [post.data.storyType] : [])
          ],
          external_url: post.data.seo?.canonical,
          _tinkbyte: {
            category: post.data.category,
            story_type: post.data.storyType,
            featured: post.data.featured,
            trending: post.data.trending,
            has_audio: post.data.hasAudio,
            audio_url: post.data.audioUrl,
            read_time: post.data.readTime,
            editorial_status: post.data.editorial?.status
          }
        };
      })
    };

    return new Response(JSON.stringify(feed, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('JSON Feed Generation Error:', error);
    return new Response('Error generating JSON feed', { status: 500 });
  }
};