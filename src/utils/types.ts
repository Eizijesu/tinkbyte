import type { CollectionEntry } from 'astro:content';

/**
 * Site configuration interface
 */
export interface SiteConfig {
  title: string;
  description: string;
  url: string;
  author: string;
  email: string;
  social: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string; //
  };
  logo: string;
  favicon: string;
  defaultImage: string;
  postsPerPage: number;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

/**
 * Blog post data interface - Updated to match your TinaCMS schema
 */
export interface BlogPostData {
  title: string;
  excerpt: string; // ✅ Changed from description to excerpt
  pubDate: Date;
  updatedDate?: Date;
  image?: string; // ✅ Changed from heroImage to image
  imageAlt?: string; // ✅ Added imageAlt
  category: string;
  tags: string[];
  author: string;
  authorBio?: string; // ✅ Added author fields from your schema
  authorAvatar?: string;
  authorRole?: string;
  authorSocial?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  featured: boolean;
  trending?: boolean; // ✅ Added trending
  draft: boolean;
  readTime?: string; // ✅ Changed from readingTime number to readTime string
  audioUrl?: string; // ✅ Added audio support
  audioDuration?: string;
  audioTranscript?: string;
  seo?: {
    title?: string;
    description?: string;
    canonical?: string;
    noindex?: boolean;
  };
}

/**
 * Author data interface
 */
export interface AuthorData {
  name: string;
  bio: string;
  avatar: string; // ✅ Made required to match your schema
  role: string; // ✅ Changed from jobTitle to role
  company?: string;
  email?: string;
  social?: { // ✅ Made optional
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  featured?: boolean;
}

/**
 * Category data interface - Updated to match your TinaCMS schema
 */
export interface CategoryData {
  name: string;
  description: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan' | 'indigo' | 'violet' | 'pink' | 'yellow'; // ✅ Specific color options
  icon: string;
  featured?: boolean;
  seo?: {
    title?: string;
    description?: string;
  };
}

/**
 * Podcast episode data interface
 */
export interface PodcastEpisodeData {
  title: string;
  description: string;
  pubDate: Date;
  duration: string;
  audioUrl: string;
  image?: string;
  transcript?: string;
  guests?: string[];
  season?: number;
  episode: number;
  featured: boolean;
  seo?: {
    title?: string;
    description?: string;
    canonical?: string;
  };
}

/**
 * Newsletter data interface - Updated for ConvertKit
 */
export interface NewsletterData {
  title: string;
  excerpt: string; // ✅ Changed from description to excerpt
  pubDate: Date;
  issue: number; // ✅ Added issue number
  featured?: boolean;
}

/**
 * Content collection type aliases
 */
export type BlogPost = CollectionEntry<'blog'>;
export type Author = CollectionEntry<'authors'>;
export type Category = CollectionEntry<'categories'>;
export type PodcastEpisode = CollectionEntry<'podcast'>;
export type Newsletter = CollectionEntry<'newsletter'>;
export type Page = CollectionEntry<'pages'>; // ✅ Added pages

// Rest of your interfaces remain the same...
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  postsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface SearchResult {
  posts: BlogPost[];
  totalResults: number;
  query: string;
  page: number;
  hasMore: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  external?: boolean;
}

export interface SEOData {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  noindex?: boolean;
  nofollow?: boolean;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  children?: TOCItem[];
}

export interface Comment {
  id: string;
  postSlug: string;
  author: string;
  email: string;
  content: string;
  createdAt: Date;
  approved: boolean;
  parentId?: string;
  replies?: Comment[];
}

export interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{
    path: string;
    views: number;
  }>;
  topReferrers: Array<{
    source: string;
    visits: number;
  }>;
}

/**
 * ConvertKit newsletter subscription interface
 */
export interface NewsletterSubscription {
  email: string;
  first_name?: string; // ✅ ConvertKit uses first_name
  subscribed: boolean;
  subscribedAt: Date;
  tags?: string[]; // ✅ ConvertKit uses tags instead of preferences
}

/**
 * Giscus comment configuration
 */
export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: 'pathname' | 'url' | 'title' | 'og:title';
  theme: 'light' | 'dark' | 'preferred_color_scheme';
  reactionsEnabled: boolean;
  emitMetadata: boolean;
  inputPosition: 'top' | 'bottom';
  lang: string;
  loading: 'lazy' | 'eager';
}

/**
 * Enhanced author info from TinaCMS schema
 */
export interface AuthorInfo {
  name: string;
  bio?: string;
  avatar?: string;
  role?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

/**
 * Hero image from TinaCMS schema
 */
export interface HeroImage {
  imageType: 'upload' | 'url';
  uploadedImage?: string;
  externalUrl?: string;
  alt: string;
  caption?: string;
}

/**
 * Editorial workflow
 */
export interface Editorial {
  status?: 'draft' | 'review' | 'approved' | 'published' | 'revision';
  assignedEditor?: string;
  editorNotes?: string;
}