// src/utils/content.ts - COMPLETE CORRECTED VERSION
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { 
  BlogPost, Author, Category, Newsletter, Podcast,
  CategorySlug, CategoryGroup, StoryType, NewsletterType,
  SearchOptions, TagWithStats, CategoryWithStats,
  EnrichedBlogPost, AuthorWithStats
} from '../../types/content';

// Export types for backward compatibility
export type { BlogPost, Author, Category, Newsletter, Podcast };

/**
 * CATEGORY MANAGEMENT - Updated for your 21 categories
 */

// Updated category definitions with proper typing
export const CATEGORY_DEFINITIONS: Record<CategorySlug, { 
  name: string; 
  color: string; 
  icon: string; 
  group: CategoryGroup;
}> = {
  // Core Themes (6)
  'build-thinking': { name: 'Build Thinking', color: 'blue', icon: 'hammer', group: 'core' },
  'learning-by-doing': { name: 'Learning by Doing', color: 'green', icon: 'book', group: 'core' },
  'fail-iterate-ship': { name: 'Fail / Iterate / Ship', color: 'orange', icon: 'repeat', group: 'core' },
  'product-lessons': { name: 'Product Lessons', color: 'purple', icon: 'lightbulb', group: 'core' },
  'startup-insight': { name: 'Startup Insight', color: 'red', icon: 'rocket', group: 'core' },
  'product-strategy': { name: 'Product Strategy', color: 'indigo', icon: 'target', group: 'core' },
  
  // Specialized Themes (8)
  'ai-evolution': { name: 'AI Evolution', color: 'violet', icon: 'brain', group: 'specialized' },
  'developer-stack-tools': { name: 'Developer Stack & Tools', color: 'emerald', icon: 'tools', group: 'specialized' },
  'research-bites': { name: 'Research Bites', color: 'pink', icon: 'chart-line', group: 'specialized' },
  'system-thinking': { name: 'System Thinking', color: 'slate', icon: 'cog', group: 'specialized' },
  'the-interface': { name: 'The Interface', color: 'cyan', icon: 'monitor', group: 'specialized' },
  'tech-culture': { name: 'Tech Culture', color: 'teal', icon: 'users', group: 'specialized' },
  'global-perspective': { name: 'Global Perspective', color: 'amber', icon: 'globe', group: 'specialized' },
  'community-innovation': { name: 'Community Innovation', color: 'violet', icon: 'users-group', group: 'specialized' },
  
  // Extended Themes (7)
  'career-stacks': { name: 'Career Stacks', color: 'indigo', icon: 'briefcase', group: 'extended' },
  'future-stacks': { name: 'Future Stacks', color: 'purple', icon: 'zap', group: 'extended' },
  'business-models-monetization': { name: 'Business Models & Monetization', color: 'green', icon: 'dollar-sign', group: 'extended' },
  'creator-economy': { name: 'Creator Economy', color: 'yellow', icon: 'star', group: 'extended' },
  'consumer-behavior-attention': { name: 'Consumer Behavior & Attention', color: 'red', icon: 'eye', group: 'extended' },
  'ecosystem-shifts-market-maps': { name: 'Ecosystem Shifts & Market Maps', color: 'blue', icon: 'map', group: 'extended' },
  'people-systems': { name: 'People Systems', color: 'orange', icon: 'users', group: 'extended' },
};

/**
 * Get published posts with proper filtering based on your TinaCMS schema
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => {
    // Filter based on your TinaCMS structure
    return !data.draft && 
           data.editorial?.status !== 'draft' && 
           data.editorial?.status !== 'revision';
  });
  
  return posts.sort((a, b) => 
    new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );
}

/**
 * Get all posts (including drafts) - useful for admin views
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog');
  return posts.sort((a, b) => 
    new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );
}

/**
 * Get published newsletters
 */
export async function getPublishedNewsletters(): Promise<Newsletter[]> {
  const newsletters = await getCollection('newsletter', ({ data }) => 
    data.status === 'published'
  );
  
  return newsletters.sort((a, b) => 
    new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime()
  );
}

/**
 * Get newsletters by type
 */
export async function getNewslettersByType(type: NewsletterType | string, limit?: number): Promise<Newsletter[]> {
  const newsletters = await getPublishedNewsletters();
  const filtered = newsletters.filter(newsletter => newsletter.data.newsletterType === type);
  return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * Get all categories with stats
 */
export async function getAllCategoriesWithStats(): Promise<CategoryWithStats[]> {
  const posts = await getPublishedPosts();
  const categories = await getCollection('categories');
  
  return categories.map(category => {
    const categoryPosts = posts.filter(post => post.data.category === category.slug);
    const lastPost = categoryPosts[0]; // Already sorted by date
    
    return {
      ...category,
      stats: {
        articleCount: categoryPosts.length,
        publishedCount: categoryPosts.length,
        lastUpdated: lastPost ? new Date(lastPost.data.pubDate) : new Date(),
      },
      recentArticles: categoryPosts.slice(0, 3),
      theme: CATEGORY_DEFINITIONS[category.slug as CategorySlug]?.group || 'extended',
    } as CategoryWithStats;
  }).sort((a, b) => b.stats.articleCount - a.stats.articleCount);
}

/**
 * Get category name
 */
export function getCategoryName(categorySlug: string): string {
  return CATEGORY_DEFINITIONS[categorySlug as CategorySlug]?.name || 
         categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get category color
 */
export function getCategoryColor(categorySlug: string): string {
  return CATEGORY_DEFINITIONS[categorySlug as CategorySlug]?.color || 'blue';
}

/**
 * Get category icon
 */
export function getCategoryIcon(categorySlug: string): string {
  return CATEGORY_DEFINITIONS[categorySlug as CategorySlug]?.icon || 'tag';
}

/**
 * Get category group
 */
export function getCategoryGroup(categorySlug: string): CategoryGroup {
  return CATEGORY_DEFINITIONS[categorySlug as CategorySlug]?.group || 'extended';
}

/**
 * Get category theme (alias for getCategoryGroup)
 */
export function getCategoryTheme(categorySlug: string): CategoryGroup {
  return getCategoryGroup(categorySlug);
}

/**
 * Get author info with enhanced social media support
 */
export function getAuthorInfo(post: BlogPost) {
  const authorInfo = post.data.authorInfo;
  
  if (!authorInfo) {
    return {
      name: 'TinkByte Team',
      role: 'Editorial Team',
      bio: 'Building meaningful, data-driven products that solve real problems',
      avatar: '/images/tinkbyte-avatar.png',
      social: {},
    };
  }
  
  return {
    name: authorInfo.name,
    role: authorInfo.role || 'Contributor',
    bio: authorInfo.bio || '',
    avatar: authorInfo.avatar || '/images/default-avatar.png',
    social: authorInfo.social || {},
  };
}

/**
 * Get hero image with your enhanced schema structure
 */
export function getHeroImage(post: BlogPost) {
  const heroImage = post.data.heroImage;
  
  if (heroImage?.imageType === 'upload' && heroImage.uploadedImage) {
    return {
      src: heroImage.uploadedImage,
      alt: heroImage.alt,
      caption: heroImage.caption,
    };
  }
  
  if (heroImage?.imageType === 'url' && heroImage.externalUrl) {
    return {
      src: heroImage.externalUrl,
      alt: heroImage.alt,
      caption: heroImage.caption,
    };
  }
  
  // Fallback to legacy image field
  if (post.data.image) {
    return {
      src: post.data.image,
      alt: post.data.imageAlt || post.data.title,
      caption: null,
    };
  }
  
  return null;
}

/**
 * Get posts by category with proper typing
 */
export async function getPostsByCategory(category: CategorySlug | string, limit?: number): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  const filtered = posts.filter(post => post.data.category === category);
  return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * Get posts by category group (core, specialized, extended)
 */
export async function getPostsByCategoryGroup(group: CategoryGroup, limit?: number): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  const categoryKeys = Object.keys(CATEGORY_DEFINITIONS).filter(
    key => CATEGORY_DEFINITIONS[key as CategorySlug].group === group
  ) as CategorySlug[];
  
  const filtered = posts.filter(post => 
    categoryKeys.includes(post.data.category as CategorySlug)
  );
  
  return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * Get posts by story type
 */
export async function getPostsByStoryType(storyType: StoryType, limit?: number): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  const filtered = posts.filter(post => post.data.storyType === storyType);
  return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * Get featured posts
 */
export async function getFeaturedPosts(limit?: number): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  const featured = posts.filter(post => post.data.featured === true);
  return limit ? featured.slice(0, limit) : featured;
}

/**
 * Get trending posts
 */
export async function getTrendingPosts(limit?: number): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  const trending = posts.filter(post => post.data.trending === true);
  return limit ? trending.slice(0, limit) : trending;
}

/**
 * Get posts with audio content
 */
export async function getAudioPosts(limit?: number): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  const audioPosts = posts.filter(post => 
    post.data.hasAudio && post.data.audioUrl
  );
  return limit ? audioPosts.slice(0, limit) : audioPosts;
}

/**
 * Get posts by author using the new authorInfo structure
 */
export async function getPostsByAuthor(authorName: string, limit?: number): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  const filtered = posts.filter(post => 
    post.data.authorInfo?.name?.toLowerCase() === authorName.toLowerCase()
  );
  return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * Get posts by multiple tags with AND/OR logic
 */
export async function getPostsByTags(
  tags: string[], 
  operator: 'AND' | 'OR' = 'OR',
  limit?: number
): Promise<BlogPost[]> {
  const allPosts = await getPublishedPosts();
  
  const filteredPosts = allPosts.filter((post) => {
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
 * Advanced search with all your schema fields
 */
export async function searchPosts(options: SearchOptions): Promise<BlogPost[]> {
  let posts = await getPublishedPosts();
  
  // Text search across title, excerpt, and content
  if (options.query) {
    const searchTerm = options.query.toLowerCase();
    posts = posts.filter(post => {
      const searchableText = [
        post.data.title,
        post.data.excerpt,
        post.data.subtitle,
        ...(post.data.tags || []),
        post.data.authorInfo?.name,
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(searchTerm);
    });
  }
  
  // Filter by category
  if (options.category) {
    posts = posts.filter(post => post.data.category === options.category);
  }
  
  // Filter by story type
  if (options.storyType) {
    posts = posts.filter(post => post.data.storyType === options.storyType);
  }
  
  // Filter by author
  if (options.author) {
    posts = posts.filter(post => 
      post.data.authorInfo?.name?.toLowerCase() === options.author?.toLowerCase()
    );
  }
  
  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    posts = posts.filter(post => {
      const postTags = (post.data.tags || []).map(tag => tag.toLowerCase());
      
      if (options.tagOperator === 'AND') {
        return options.tags!.every(tag => 
          postTags.includes(tag.toLowerCase())
        );
      } else {
        return options.tags!.some(tag => 
          postTags.includes(tag.toLowerCase())
        );
      }
    });
  }
  
  // Filter by featured status
  if (options.featured !== undefined) {
    posts = posts.filter(post => post.data.featured === options.featured);
  }
  
  // Filter by trending status
  if (options.trending !== undefined) {
    posts = posts.filter(post => post.data.trending === options.trending);
  }
  
  // Filter by audio availability
  if (options.hasAudio !== undefined) {
    posts = posts.filter(post => 
      Boolean(post.data.hasAudio && post.data.audioUrl) === options.hasAudio
    );
  }
  
  // Filter by date range
  if (options.dateRange) {
    posts = posts.filter(post => {
      const postDate = new Date(post.data.pubDate);
      if (options.dateRange!.start && postDate < options.dateRange!.start) return false;
      if (options.dateRange!.end && postDate > options.dateRange!.end) return false;
      return true;
    });
  }
  
  // Apply pagination
  if (options.offset) {
    posts = posts.slice(options.offset);
  }
  
  if (options.limit) {
    posts = posts.slice(0, options.limit);
  }
  
  return posts;
}

/**
 * Get all tags with enhanced metadata
 */
export async function getAllTags(): Promise<TagWithStats[]> {
  const posts = await getPublishedPosts();
  const tagMap = new Map<string, { posts: BlogPost[]; lastUsed: Date }>();
  
  posts.forEach(post => {
    const postDate = new Date(post.data.pubDate);
    (post.data.tags || []).forEach(tag => {
      const normalizedTag = tag.toLowerCase().replace(/\s+/g, '-');
      if (!tagMap.has(normalizedTag)) {
        tagMap.set(normalizedTag, { posts: [], lastUsed: postDate });
      }
      const tagData = tagMap.get(normalizedTag)!;
      tagData.posts.push(post);
      if (postDate > tagData.lastUsed) {
        tagData.lastUsed = postDate;
      }
    });
  });
  
  return Array.from(tagMap.entries()).map(([slug, data]) => ({
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    slug,
    count: data.posts.length,
    color: getTagColor(slug),
    posts: data.posts,
    lastUsed: data.lastUsed,
  })).sort((a, b) => b.count - a.count);
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
  const posts = await getPublishedPosts();
  const categoryMap = new Map<string, BlogPost[]>();
  
  posts.forEach((post) => {
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
 * Get related posts based on category and tags
 */
export async function getRelatedPosts(currentPost: BlogPost, limit = 3): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  const otherPosts = posts.filter(post => post.slug !== currentPost.slug);
  
  const scoredPosts = otherPosts.map(post => {
    let score = 0;
    
    // Same category gets high score
    if (post.data.category === currentPost.data.category) {
      score += 5;
    }
    
    // Same story type gets medium score
    if (post.data.storyType === currentPost.data.storyType) {
      score += 3;
    }
    
    // Shared tags get points
    const currentTags = currentPost.data.tags || [];
    const postTags = post.data.tags || [];
    const sharedTags = postTags.filter(tag => currentTags.includes(tag));
    score += sharedTags.length * 2;
    
    // Same author gets bonus
    if (post.data.authorInfo?.name === currentPost.data.authorInfo?.name) {
      score += 1;
    }
    
    return { post, score };
  });
  
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
}

/**
 * NEWSLETTER UTILITIES - Updated for your 12 newsletters
 */
export const NEWSLETTER_DEFINITIONS: Record<NewsletterType, { 
  name: string; 
  frequency: string; 
  day: string;
}> = {
  // Weekly Publications
  'tinkbyte-weekly': { name: 'TinkByte Weekly', frequency: 'weekly', day: 'Monday' },
  'build-sheet': { name: 'Build Sheet', frequency: 'weekly', day: 'Tuesday' },
  'stackdown': { name: 'Stackdown', frequency: 'weekly', day: 'Wednesday' },
  'signal-drop': { name: 'Signal Drop', frequency: 'weekly', day: 'Thursday' },
  'system-signal': { name: 'System Signal', frequency: 'weekly', day: 'Friday' },
  
  // Monthly Deep Dives
  'the-real-build': { name: 'The Real Build', frequency: 'monthly', day: '1st' },
  'the-loop': { name: 'The Loop', frequency: 'monthly', day: '5th' },
  'data-slice': { name: 'Data Slice', frequency: 'monthly', day: '10th' },
  'the-mirror': { name: 'The Mirror', frequency: 'monthly', day: '15th' },
  'community-code': { name: 'Community Code', frequency: 'monthly', day: '20th' },
  'career-stack': { name: 'Career Stack', frequency: 'monthly', day: '25th' },
  
  // Limited Series
  'start-here-future-tech': { name: 'Start Here: Future Tech', frequency: 'limited-series', day: 'Quarterly' },
};

/**
 * UTILITY FUNCTIONS
 */

export function getTagColor(tagSlug: string): string {
  const colorMap: Record<string, string> = {
    // AI & Technology
    'artificial-intelligence': 'purple', 'ai': 'purple', 'machine-learning': 'purple',
    'ai-evolution': 'purple', 'automation': 'purple',
    
    // Product & Strategy  
    'product-management': 'green', 'product-strategy': 'green', 'product-lessons': 'green',
    'ux': 'green', 'ui': 'green', 'design': 'green',
    
    // Development & Tools
    'developer-tools': 'teal', 'programming': 'teal', 'coding': 'teal',
    'developer-stack-tools': 'teal', 'frameworks': 'teal',
    
    // Business & Startup
    'startup': 'orange', 'startup-insight': 'orange', 'business': 'orange',
    'entrepreneurship': 'orange', 'scaling': 'orange',
    
    // Future Tech
    'future-stacks': 'indigo', 'web3': 'indigo', 'blockchain': 'indigo',
    'emerging-tech': 'indigo',
    
    // Culture & People
    'tech-culture': 'pink', 'people-systems': 'blue', 'remote-work': 'blue',
    'team-building': 'blue',
    
    // Research & Analysis
    'research-bites': 'pink', 'data': 'indigo', 'analytics': 'indigo',
    'market-research': 'pink',
    
    // Career & Growth
    'career-stacks': 'red', 'learning': 'cyan', 'learning-by-doing': 'cyan',
    'skills': 'cyan',
  };
  
  return colorMap[tagSlug] || 'blue';
}

/**
 * Format dates consistently
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Calculate reading time
 */
export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Create URL-friendly slugs
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
 * Enhanced post retrieval with new schema fields
 */
export async function getEnhancedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => {
    return data.draft !== true && data.editorial?.status !== 'draft';
  });
  
  return posts.sort((a, b) => 
    new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );
}