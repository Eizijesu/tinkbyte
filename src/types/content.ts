// src/types/content.ts 
interface BaseCollectionEntry<T> {
  id: string;
  slug: string;
  body: string;
  collection: string;
  data: T;
}

// Content data interfaces
interface BlogData {
  title: string;
  pubDate: Date;
  category?: string;
  featured?: boolean;
  tags?: string[];
  excerpt?: string;
  description?: string;
  readTime?: string;
  authorInfo?: {
    name: string;
    role?: string;
  };
  heroImage?: any;
  image?: string;
  audioUrl?: string;
  draft?: boolean;
}

interface AuthorData {
  name: string;
  featured?: boolean;
  pubDate?: Date;
  bio?: string;
  avatar?: string;
  role?: string;
  is_verified?: boolean;
  is_active?: boolean;
  article_count?: number;
}

interface CategoryData {
  name: string;
  description?: string;
  color?: string;
  is_featured?: boolean;
  featured?: boolean;
  is_premium?: boolean;
}

interface NewsletterData {
  title: string;
  publishDate: Date;
  excerpt?: string;
  featured?: boolean;
  highlights?: any[];
  tags?: string[];
  stats?: {
    subscribers?: number;
    openRate?: number;
  };
}

interface PodcastData {
  title: string;
  pubDate: Date;
  category?: string;
  featured?: boolean;
  guests?: any[];
  tags?: string[];
  host?: string;
  is_published?: boolean;
}

interface PageData {
  title: string;
  description?: string;
  layout?: string;
}

interface LegalData {
  title: string;
  lastUpdated: Date;
  version?: string;
  type: 'privacy' | 'terms' | 'cookies' | 'disclaimer';
}

interface SettingsData {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

interface ContactData {
  name: string;
  email: string;
  department?: string;
  role?: string;
}

interface AllTopicsData {
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

// Export the main types
export type BlogPost = BaseCollectionEntry<BlogData>;
export type Author = BaseCollectionEntry<AuthorData>;
export type Category = BaseCollectionEntry<CategoryData>;
export type Newsletter = BaseCollectionEntry<NewsletterData>;
export type Podcast = BaseCollectionEntry<PodcastData>;
export type Page = BaseCollectionEntry<PageData>;
export type Legal = BaseCollectionEntry<LegalData>;
export type Settings = BaseCollectionEntry<SettingsData>;
export type Contact = BaseCollectionEntry<ContactData>;
export type AllTopics = BaseCollectionEntry<AllTopicsData>;

// Generic CollectionEntry type for compatibility
export type CollectionEntry<T extends string> = T extends 'blog' ? BlogPost :
  T extends 'authors' ? Author :
  T extends 'categories' ? Category :
  T extends 'newsletter' ? Newsletter :
  T extends 'podcast' ? Podcast :
  T extends 'pages' ? Page :
  T extends 'legal' ? Legal :
  T extends 'settings' ? Settings :
  T extends 'contact' ? Contact :
  T extends 'allTopics' ? AllTopics :
  BaseCollectionEntry<any>;

// Enhanced types with dynamic data
export interface EnrichedBlogPost extends BlogPost {
  dynamicData?: {
    commentCount: number;
    likeCount: number;
    viewCount: number;
    readingProgress?: number;
  };
  authorData?: Author;
  categoryData?: Category;
  relatedPosts?: BlogPost[];
}

export interface EnrichedAuthor extends Author {
  stats: {
    articleCount: number;
    publishedCount: number;
    draftCount: number;
  };
  recentArticles: BlogPost[];
  socialLinks: Array<{
    platform: string;
    url: string;
    username?: string;
  }>;
}

export interface CategoryWithStats extends Category {
  stats: {
    articleCount: number;
    publishedCount: number;
    lastUpdated: Date;
  };
  recentArticles: BlogPost[];
  theme: 'core' | 'specialized' | 'extended';
}

// Updated newsletter types for your 12 newsletters
export type NewsletterType = 
  | 'tinkbyte-weekly'
  | 'build-sheet'
  | 'stackdown'
  | 'signal-drop'
  | 'system-signal'
  | 'the-real-build'
  | 'the-loop'
  | 'data-slice'
  | 'the-mirror'
  | 'community-code'
  | 'career-stack'
  | 'start-here-future-tech';

// Updated story types from your TinaCMS config
export type StoryType = 
  | 'feature'
  | 'technical-analysis'
  | 'quick-read'
  | 'data-story'
  | 'build-guide'
  | 'failure-story'
  | 'global-spotlight'
  | 'experiment-log'
  | 'case-study'
  | 'framework-guide'
  | 'pattern-analysis'
  | 'deep-dive';

// Updated category types for your 21 categories
export type CategorySlug = 
  // Core Themes
  | 'build-thinking'
  | 'learning-by-doing'
  | 'fail-iterate-ship'
  | 'product-lessons'
  | 'startup-insight'
  | 'product-strategy'
  // Specialized Themes
  | 'ai-evolution'
  | 'developer-stack-tools'
  | 'research-bites'
  | 'system-thinking'
  | 'the-interface'
  | 'tech-culture'
  | 'global-perspective'
  | 'community-innovation'
  // Extended Themes
  | 'career-stacks'
  | 'future-stacks'
  | 'business-models-monetization'
  | 'creator-economy'
  | 'consumer-behavior-attention'
  | 'ecosystem-shifts-market-maps'
  | 'people-systems';

export type CategoryGroup = 'core' | 'specialized' | 'extended';

export interface CategoryGrouping {
  core: CategoryWithStats[];
  specialized: CategoryWithStats[];
  extended: CategoryWithStats[];
}

// Editorial workflow types
export type EditorialStatus = 'draft' | 'review' | 'approved' | 'published' | 'revision';

// Social media platform types
export type SocialPlatform = 
  | 'twitter' | 'linkedin' | 'github' | 'instagram' | 'youtube'
  | 'discord' | 'substack' | 'medium' | 'devto' | 'hashnode'
  | 'reddit' | 'facebook' | 'tiktok' | 'threads' | 'mastodon'
  | 'website' | 'email';

export interface SocialLinks {
  [key: string]: string | undefined;
}

// Search and filter types
export interface SearchOptions {
  query?: string;
  tags?: string[];
  category?: CategorySlug;
  storyType?: StoryType;
  author?: string;
  featured?: boolean;
  trending?: boolean;
  hasAudio?: boolean;
  tagOperator?: 'AND' | 'OR';
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  limit?: number;
  offset?: number;
}

export interface TagWithStats {
  name: string;
  slug: string;
  count: number;
  color: string;
  posts: BlogPost[];
  lastUsed: Date;
}

export interface AuthorWithStats {
  author: Author;
  stats: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    featuredPosts: number;
    totalViews?: number;
    avgReadTime?: number;
  };
  recentPosts: BlogPost[];
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}