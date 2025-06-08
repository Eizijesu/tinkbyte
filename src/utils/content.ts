// src/utils/content.ts - Updated with getTagColor function
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;
export type Author = CollectionEntry<'authors'>;
export type Category = CollectionEntry<'categories'>;

/**
 * Get tag color based on tag slug
 */
export function getTagColor(tagSlug: string): string {
  const colorMap: Record<string, string> = {
    // AI & Technology
    'artificial-intelligence': 'purple',
    'machine-learning': 'purple',
    'ai-evolution': 'purple',
    'ai': 'purple',
    
    // Product & Strategy
    'product-management': 'green',
    'product-strategy': 'green',
    'product-insights': 'green',
    'user-experience': 'green',
    'ux': 'green',
    
    // Work & Culture
    'remote-work': 'blue',
    'tech-culture': 'blue',
    'team-building': 'blue',
    'workplace': 'blue',
    
    // Business & Startup
    'startup-culture': 'orange',
    'startup-lessons': 'orange',
    'entrepreneurship': 'orange',
    'business': 'orange',
    'scaling': 'orange',
    
    // Technology Trends
    'web3': 'indigo',
    'blockchain': 'indigo',
    'crypto': 'indigo',
    'emerging-tech': 'indigo',
    'future-tech': 'indigo',
    
    // Development
    'developer-experience': 'teal',
    'developer-tools': 'teal',
    'programming': 'teal',
    'coding': 'teal',
    'development': 'teal',
    
    // Industry & Analysis
    'tech-trends': 'pink',
    'industry-analysis': 'pink',
    'market-trends': 'pink',
    'analysis': 'pink',
    
    // Innovation & Ideas
    'innovation': 'red',
    'creativity': 'red',
    'ideas': 'red',
    'breakthrough': 'red',
    
    // TinaCMS Content Pillars
    'build-thinking': 'purple',
    'community-innovation': 'green',
    'learning-by-doing': 'blue',
    'no-fluff-coverage': 'orange',
    'research-backed': 'indigo',
    'global-perspective': 'teal',
    
    // Additional common tags
    'productivity': 'cyan',
    'tools': 'cyan',
    'frameworks': 'cyan',
    'design': 'pink',
    'leadership': 'yellow',
    'management': 'yellow',
    'career': 'yellow',
    'growth': 'green',
    'marketing': 'red',
    'sales': 'red',
    'data': 'indigo',
    'analytics': 'indigo',
    'security': 'red',
    'privacy': 'red',
  };
  
  return colorMap[tagSlug] || 'blue';
}

/**
 * Get category color based on category name
 */
export function getCategoryColor(categoryName: string): string {
  const colorMap: Record<string, string> = {
    'Build Thinking': 'purple',
    'Community Innovation': 'green',
    'Learning by Doing': 'blue',
    'No-Fluff Tech Coverage': 'orange',
    'Research-Backed': 'indigo',
    'Global Perspective': 'teal',
    'Product Strategy': 'green',
    'Tech Culture': 'blue',
    'AI Evolution': 'purple',
    'Developer Tools': 'teal',
    'Industry Analysis': 'pink',
    'Startup Lessons': 'orange',
    'Innovation': 'red',
  };
  
  return colorMap[categoryName] || 'blue';
}

/**
 * Get all published blog posts sorted by publication date (newest first)
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => {
    return data.draft !== true;
  });
  
  return posts.sort((a: BlogPost, b: BlogPost) => 
    new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );
}

/**
 * Get posts by multiple tags with AND/OR logic
 */
export async function getPostsByTags(
  tags: string[], 
  operator: 'AND' | 'OR' = 'OR',
  limit?: number
): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  
  const filteredPosts = allPosts.filter((post: BlogPost) => {
    const postTags = post.data.tags.map((tag: string) => 
      tag.toLowerCase().replace(/\s+/g, '-')
    );
    
    const searchTags = tags.map((tag: string) => 
      tag.toLowerCase().replace(/\s+/g, '-')
    );
    
    if (operator === 'AND') {
      // Post must have ALL specified tags
      return searchTags.every((tag: string) => postTags.includes(tag));
    } else {
      // Post must have ANY of the specified tags
      return searchTags.some((tag: string) => postTags.includes(tag));
    }
  });
  
  return limit ? filteredPosts.slice(0, limit) : filteredPosts;
}

/**
 * Get posts by single tag (backward compatibility)
 */
export async function getPostsByTag(tag: string, limit?: number): Promise<BlogPost[]> {
  return getPostsByTags([tag], 'OR', limit);
}

/**
 * Get posts by category with proper typing
 */
export async function getPostsByCategory(category: string, limit?: number): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  const categoryPosts = allPosts.filter((post: BlogPost) => 
    post.data.category.toLowerCase().replace(/\s+/g, '-') === 
    category.toLowerCase().replace(/\s+/g, '-')
  );
  
  return limit ? categoryPosts.slice(0, limit) : categoryPosts;
}

/**
 * Get all unique tags with post counts and metadata
 */
export async function getAllTags(): Promise<Array<{
  name: string;
  slug: string;
  count: number;
  posts: BlogPost[];
}>> {
  const posts = await getAllPosts();
  const tagMap = new Map<string, BlogPost[]>();
  
  posts.forEach((post: BlogPost) => {
    post.data.tags.forEach((tag: string) => {
      const normalizedTag = tag.toLowerCase().replace(/\s+/g, '-');
      if (!tagMap.has(normalizedTag)) {
        tagMap.set(normalizedTag, []);
      }
      tagMap.get(normalizedTag)!.push(post);
    });
  });
  
  return Array.from(tagMap.entries()).map(([slug, tagPosts]) => ({
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    slug,
    count: tagPosts.length,
    posts: tagPosts
  })).sort((a, b) => b.count - a.count);
}

/**
 * Get related posts based on shared tags and category
 */
export async function getRelatedPosts(
  currentPost: BlogPost, 
  limit: number = 3
): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  
  // Filter out the current post
  const otherPosts = allPosts.filter((post: BlogPost) => post.slug !== currentPost.slug);
  
  // Score posts based on shared category and tags
  const scoredPosts = otherPosts.map((post: BlogPost) => {
    let score = 0;
    
    // Same category gets higher score
    if (post.data.category === currentPost.data.category) {
      score += 3;
    }
    
    // Shared tags get points
    const sharedTags = post.data.tags.filter((tag: string) => 
      currentPost.data.tags.includes(tag)
    );
    score += sharedTags.length;
    
    return { post, score };
  });
  
  // Sort by score and return top results
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
}

/**
 * Advanced search with multi-criteria filtering
 */
export async function searchPosts(options: {
  query?: string;
  tags?: string[];
  category?: string;
  author?: string;
  featured?: boolean;
  tagOperator?: 'AND' | 'OR';
  limit?: number;
}): Promise<BlogPost[]> {
  let posts = await getAllPosts();
  
  // Filter by search query
  if (options.query) {
    const searchTerm = options.query.toLowerCase();
    posts = posts.filter((post: BlogPost) => {
      const title = post.data.title.toLowerCase();
      const excerpt = post.data.excerpt.toLowerCase();
      const category = post.data.category.toLowerCase();
      const tags = post.data.tags.join(' ').toLowerCase();
      
      return title.includes(searchTerm) || 
             excerpt.includes(searchTerm) || 
             category.includes(searchTerm) || 
             tags.includes(searchTerm);
    });
  }
  
  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    posts = posts.filter((post: BlogPost) => {
      const postTags = post.data.tags.map((tag: string) => 
        tag.toLowerCase().replace(/\s+/g, '-')
      );
      
      const searchTags = options.tags!.map((tag: string) => 
        tag.toLowerCase().replace(/\s+/g, '-')
      );
      
      if (options.tagOperator === 'AND') {
        return searchTags.every((tag: string) => postTags.includes(tag));
      } else {
        return searchTags.some((tag: string) => postTags.includes(tag));
      }
    });
  }
  
  // Filter by category
  if (options.category) {
    posts = posts.filter((post: BlogPost) => 
      post.data.category.toLowerCase().replace(/\s+/g, '-') === 
      options.category!.toLowerCase().replace(/\s+/g, '-')
    );
  }
  
  // Filter by author
  if (options.author) {
    posts = posts.filter((post: BlogPost) => 
      post.data.author.toLowerCase().replace(/\s+/g, '-') === 
      options.author!.toLowerCase().replace(/\s+/g, '-')
    );
  }
  
  // Filter by featured status
  if (options.featured !== undefined) {
    posts = posts.filter((post: BlogPost) => post.data.featured === options.featured);
  }
  
  return options.limit ? posts.slice(0, options.limit) : posts;
}

/**
 * Helper function to create URL-friendly slugs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get tag suggestions based on partial input
 */
export async function getTagSuggestions(partial: string, limit: number = 10): Promise<string[]> {
  const allTags = await getAllTags();
  const searchTerm = partial.toLowerCase();
  
  return allTags
    .filter(tag => tag.name.toLowerCase().includes(searchTerm))
    .slice(0, limit)
    .map(tag => tag.slug);
}

/**
 * Get all unique categories with post counts and metadata
 */
export async function getAllCategories(): Promise<Array<{
  name: string;
  slug: string;
  count: number;
  posts: BlogPost[];
  data?: {
    description?: string;
    color?: string;
    icon?: string;
    featured?: boolean;
  };
}>> {
  const posts = await getAllPosts();
  const categoryMap = new Map<string, BlogPost[]>();
  
  posts.forEach((post: BlogPost) => {
    const category = post.data.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(post);
  });
  
  return Array.from(categoryMap.entries()).map(([name, categoryPosts]) => ({
    name,
    slug: slugify(name),
    count: categoryPosts.length,
    posts: categoryPosts,
    data: {
      description: `Explore ${name} articles and insights`,
      color: getCategoryColor(name),
      icon: 'tag',
      featured: false
    }
  })).sort((a, b) => b.count - a.count);
}