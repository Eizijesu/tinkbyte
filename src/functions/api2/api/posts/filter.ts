// src/pages/api/posts/filter.ts
import type { APIRoute } from 'astro';
import { searchPosts } from '../../../utils/content';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      tags = [],
      category,
      author,
      query,
      featured,
      tagOperator = 'OR',
      limit = 12,
      sortBy = 'date-desc'
    } = body;

    // Get filtered posts
    const posts = await searchPosts({
      query,
      tags,
      category,
      author,
      featured,
      tagOperator,
      limit: limit * 2 // Get more for sorting
    });

    // Apply sorting
    let sortedPosts = [...posts];
    switch (sortBy) {
      case 'date-asc':
        sortedPosts.sort((a, b) => 
          new Date(a.data.pubDate).getTime() - new Date(b.data.pubDate).getTime()
        );
        break;
      case 'title-asc':
        sortedPosts.sort((a, b) => a.data.title.localeCompare(b.data.title));
        break;
      case 'title-desc':
        sortedPosts.sort((a, b) => b.data.title.localeCompare(a.data.title));
        break;
      default: // date-desc
        sortedPosts.sort((a, b) => 
          new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
        );
    }

    // Apply final limit
    const finalPosts = sortedPosts.slice(0, limit);

    // Transform for frontend
    const transformedPosts = finalPosts.map(post => ({
      title: post.data.title,
      excerpt: post.data.excerpt,
      pubDate: post.data.pubDate,
      readTime: post.data.readTime || "5 min read",
      slug: post.slug,
      image: post.data.image,
      tags: post.data.tags,
      category: post.data.category,
      author: {
        name: post.data.author,
        avatar: post.data.authorAvatar || "/images/default-avatar.jpg",
        role: post.data.authorRole || "Author",
        bio: post.data.authorBio || "Content creator",
      },
      featured: post.data.featured
    }));

    return new Response(JSON.stringify({
      success: true,
      posts: transformedPosts,
      total: posts.length,
      filtered: finalPosts.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Filter API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to filter posts'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  // Handle GET requests for simple tag filtering
  const searchParams = new URLSearchParams(url.search);
  const tags = searchParams.get('tags')?.split(',') || [];
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '12');

  try {
    const posts = await searchPosts({
      tags,
      category,
      limit
    });

    const transformedPosts = posts.map(post => ({
      title: post.data.title,
      excerpt: post.data.excerpt,
      pubDate: post.data.pubDate,
      slug: post.slug,
      tags: post.data.tags,
      category: post.data.category
    }));

    return new Response(JSON.stringify({
      success: true,
      posts: transformedPosts
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch posts'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};