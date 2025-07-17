// src/utils/content.ts - 
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/**
 * Get tag color based on tag slug - Complete TinkByte mapping
 */
export function getTagColor(tagSlug: string): string {
  const colorMap: Record<string, string> = {
    // AI & Technology
    'artificial-intelligence': 'purple',
    'machine-learning': 'purple',
    'ai-evolution': 'purple',
    'ai': 'purple',
    'automation': 'purple',
    'neural-networks': 'purple',
    
    // Product & Strategy
    'product-management': 'green',
    'product-strategy': 'green',
    'product-insights': 'green',
    'product-lessons': 'green',
    'user-experience': 'green',
    'ux': 'green',
    'ui': 'green',
    'design-thinking': 'green',
    
    // Work & Culture
    'remote-work': 'blue',
    'tech-culture': 'blue',
    'team-building': 'blue',
    'workplace': 'blue',
    'collaboration': 'blue',
    'communication': 'blue',
    'people-systems': 'blue',
    
    // Business & Startup
    'startup-culture': 'orange',
    'startup-lessons': 'orange',
    'startup-insight': 'orange',
    'entrepreneurship': 'orange',
    'business': 'orange',
    'scaling': 'orange',
    'business-models': 'orange',
    'monetization': 'orange',
    'funding': 'orange',
    
    // Technology Trends & Future
    'web3': 'indigo',
    'blockchain': 'indigo',
    'crypto': 'indigo',
    'emerging-tech': 'indigo',
    'future-tech': 'indigo',
    'future-stacks': 'indigo',
    'quantum': 'indigo',
    'ar-vr': 'indigo',
    'iot': 'indigo',
    
    // Development & Tools
    'developer-experience': 'teal',
    'developer-tools': 'teal',
    'programming': 'teal',
    'coding': 'teal',
    'development': 'teal',
    'frameworks': 'teal',
    'apis': 'teal',
    'devops': 'teal',
    'infrastructure': 'teal',
    
    // Industry & Analysis
    'tech-trends': 'pink',
    'industry-analysis': 'pink',
    'market-trends': 'pink',
    'analysis': 'pink',
    'research': 'pink',
    'research-bites': 'pink',
    'data-analysis': 'pink',
    'market-maps': 'pink',
    
    // Innovation & Ideas
    'innovation': 'red',
    'creativity': 'red',
    'ideas': 'red',
    'breakthrough': 'red',
    'experimentation': 'red',
    'prototyping': 'red',
    
    // Learning & Growth
    'learning': 'cyan',
    'learning-by-doing': 'cyan',
    'education': 'cyan',
    'skills': 'cyan',
    'career': 'cyan',
    'career-stacks': 'cyan',
    'professional-development': 'cyan',
    
    // TinaCMS Content Pillars
    'build-thinking': 'purple',
    'community-innovation': 'green',
    'global-perspective': 'teal',
    'system-thinking': 'emerald',
    'fail-iterate-ship': 'orange',
    'the-interface': 'blue',
    
    // Additional common tags
    'productivity': 'yellow',
    'tools': 'yellow',
    'efficiency': 'yellow',
    'optimization': 'yellow',
    'design': 'pink',
    'leadership': 'red',
    'management': 'red',
    'growth': 'green',
    'marketing': 'orange',
    'sales': 'orange',
    'data': 'indigo',
    'analytics': 'indigo',
    'security': 'red',
    'privacy': 'red',
    'creator-economy': 'pink',
    'consumer-behavior': 'cyan',
    'attention': 'cyan',
    'psychology': 'purple',
  };
  
  return colorMap[tagSlug] || 'blue';
}

/**
 * Get category color based on category name - Complete TinkByte categories
 */
export function getCategoryColor(categoryName: string): string {
  const colorMap: Record<string, string> = {
    // Core Themes (both full and alias)
    'Build Thinking': 'blue',
    'build-thinking': 'blue',
    'Learning by Doing': 'purple', 
    'learning-by-doing': 'purple',
    'Fail / Iterate / Ship': 'orange',
    'fail-iterate-ship': 'orange',
    'build-loop': 'orange', 
    'Product Lessons': 'green',
    'product-lessons': 'green',
    'Startup Insight': 'red',
    'startup-insight': 'red',
    'Product Strategy': 'indigo',
    'product-strategy': 'indigo',
    
    // Specialized Themes (both full and alias)
    'AI Evolution': 'violet',
    'ai-evolution': 'violet',
    'Developer Stack & Tools': 'emerald',
    'developer-stack-tools': 'emerald',
    'developer-tools': 'emerald',       
    'Research Bites': 'pink',
    'research-bites': 'pink',
    'research-backed': 'pink',
    'System Thinking': 'emerald',
    'system-thinking': 'emerald',
    'The Interface': 'blue',
    'the-interface': 'blue',
    'Tech Culture': 'pink',
    'tech-culture': 'pink',
    'Global Perspective': 'cyan',
    'global-perspective': 'cyan',
    'Community Innovation': 'green',
    'community-innovation': 'green',
    
    // Extended Themes (both full and alias)
    'Career Stacks': 'red',
    'career-stacks': 'red',
    'Future Stacks': 'violet',
    'future-stacks': 'violet',
    'Creator Economy': 'pink',
    'creator-economy': 'pink',
    'Business Models & Monetization': 'indigo',
    'business-models-monetization': 'indigo', 
    'business-models': 'indigo',              
    'Consumer Behavior & Attention': 'cyan',
    'consumer-behavior-attention': 'cyan',    
    'consumer-behavior': 'cyan',              
    'Ecosystem Shifts & Market Maps': 'emerald',
    'ecosystem-shifts-market-maps': 'emerald', 
    'market-maps': 'emerald',                  
    'People Systems': 'orange',
    'people-systems': 'orange',
  };
  
  const normalizedName = categoryName?.toLowerCase().replace(/\s+/g, '-') || '';
  return colorMap[categoryName] || colorMap[normalizedName] || 'blue';
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
    const postTags = (post.data.tags || []).map((tag: string) => 
      tag.toLowerCase().replace(/\s+/g, '-')
    );
    
    const searchTags = tags.map((tag: string) => 
      tag.toLowerCase().replace(/\s+/g, '-')
    );
    
    if (operator === 'AND') {
      return searchTags.every((tag: string) => postTags.includes(tag));
    } else {
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
  const categoryPosts = allPosts.filter((post: BlogPost) => {
    const postCategory = post.data.category?.toLowerCase().replace(/\s+/g, '-') || '';
    const searchCategory = category.toLowerCase().replace(/\s+/g, '-');
    return postCategory === searchCategory;
  });
  
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
    const tags = post.data.tags || [];
    tags.forEach((tag: string) => {
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
  
  const otherPosts = allPosts.filter((post: BlogPost) => post.slug !== currentPost.slug);
  
  const scoredPosts = otherPosts.map((post: BlogPost) => {
    let score = 0;
    
    // Same category gets higher score
    if (post.data.category === currentPost.data.category) {
      score += 3;
    }
    
    // Shared tags get points
    const currentTags = currentPost.data.tags || [];
    const postTags = post.data.tags || [];
    const sharedTags = postTags.filter((tag: string) => 
      currentTags.includes(tag)
    );
    score += sharedTags.length;
    
    return { post, score };
  });
  
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
      const title = post.data.title?.toLowerCase() || '';
      const excerpt = post.data.excerpt?.toLowerCase() || '';
      const category = post.data.category?.toLowerCase() || '';
      const tags = (post.data.tags || []).join(' ').toLowerCase();
      
      return title.includes(searchTerm) || 
             excerpt.includes(searchTerm) || 
             category.includes(searchTerm) || 
             tags.includes(searchTerm);
    });
  }
  
  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    posts = posts.filter((post: BlogPost) => {
      const postTags = (post.data.tags || []).map((tag: string) => 
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
    posts = posts.filter((post: BlogPost) => {
      const postCategory = post.data.category?.toLowerCase().replace(/\s+/g, '-') || '';
      const searchCategory = options.category!.toLowerCase().replace(/\s+/g, '-');
      return postCategory === searchCategory;
    });
  }
  
  // Filter by author
  if (options.author) {
    posts = posts.filter((post: BlogPost) => {
      const postAuthor = post.data.author?.toLowerCase().replace(/\s+/g, '-') || '';
      const searchAuthor = options.author!.toLowerCase().replace(/\s+/g, '-');
      return postAuthor === searchAuthor;
    });
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
    if (category && !categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    if (category) {
      categoryMap.get(category)!.push(post);
    }
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

/**
 * Helper function to format dates consistently
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Get featured posts
 */
export async function getFeaturedPosts(limit?: number): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  const featuredPosts = allPosts.filter((post: BlogPost) => post.data.featured === true);
  
  return limit ? featuredPosts.slice(0, limit) : featuredPosts;
}

/**
 * Get trending posts (you can customize the logic)
 */
export async function getTrendingPosts(limit: number = 5): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  
  // Simple trending logic: recent posts with high engagement
  // You can customize this based on your metrics
  const recentPosts = allPosts.filter((post: BlogPost) => {
    const postDate = new Date(post.data.pubDate);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return postDate > thirtyDaysAgo;
  });
  
  return recentPosts.slice(0, limit);
}

/**
 * Enhanced post retrieval with new schema fields
 */
export async function getEnhancedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => {
    return data.draft !== true && data.editorial?.status !== 'draft';
  });
  
  return posts.sort((a: BlogPost, b: BlogPost) => 
    new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );
}

/**
 * Get posts by story type (new field in your schema)
 */
export async function getPostsByStoryType(
  storyType: string, 
  limit?: number
): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  const filtered = posts.filter((post: BlogPost) => 
    post.data.storyType === storyType
  );
  
  return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * Get posts with audio content
 */
export async function getAudioPosts(limit?: number): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  const audioPosts = posts.filter((post: BlogPost) => 
    post.data.audioUrl && post.data.audioDuration
  );
  
  return limit ? audioPosts.slice(0, limit) : audioPosts;
}

/**
 * Enhanced author information extraction
 */
export function getAuthorInfo(post: BlogPost) {
  const authorInfo = post.data.authorInfo;
  if (!authorInfo) {
    return {
      name: 'TinkByte Team',
      role: 'Editorial Team',
      bio: 'Building meaningful, data-driven products that solve real problems',
      avatar: null,
      social: {}
    };
  }
  
  return {
    name: authorInfo.name,
    role: authorInfo.role || 'Contributor',
    bio: authorInfo.bio || '',
    avatar: authorInfo.avatar || null,
    social: authorInfo.social || {}
  };
}

/**
 * Get hero image with fallback logic
 */
export function getHeroImage(post: BlogPost) {
  const heroImage = post.data.heroImage;
  
  if (heroImage?.imageType === 'upload' && heroImage.uploadedImage) {
    return {
      src: heroImage.uploadedImage,
      alt: heroImage.alt,
      caption: heroImage.caption
    };
  }
  
  if (heroImage?.imageType === 'url' && heroImage.externalUrl) {
    return {
      src: heroImage.externalUrl,
      alt: heroImage.alt,
      caption: heroImage.caption
    };
  }
  
  // Fallback to legacy image field
  if (post.data.image) {
    return {
      src: post.data.image,
      alt: post.data.imageAlt || post.data.title,
      caption: null
    };
  }
  
  return null;
}

/**
 * Enhanced category utilities with theme grouping
 */
export function getCategoryTheme(categorySlug: string): 'core' | 'specialized' | 'extended' {
  const coreThemes = [
    'build-thinking', 'learning-by-doing', 'fail-iterate-ship',
    'product-lessons', 'startup-insight', 'product-strategy'
  ];
  
  const specializedThemes = [
    'ai-evolution', 'developer-stack-tools', 'research-bites',
    'system-thinking', 'the-interface', 'tech-culture',
    'global-perspective', 'community-innovation'
  ];
  
  if (coreThemes.includes(categorySlug)) return 'core';
  if (specializedThemes.includes(categorySlug)) return 'specialized';
  return 'extended';
}