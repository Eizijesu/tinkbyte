// src/types/content.ts
import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;
export type Author = CollectionEntry<'authors'>;
export type Category = CollectionEntry<'categories'>;
export type Newsletter = CollectionEntry<'newsletter'>;
export type Podcast = CollectionEntry<'podcast'>;

export interface EnrichedBlogPost extends BlogPost {
  dynamicData: {
    commentCount: number;
    likeCount: number;
    viewCount: number;
  };
}

export interface EnrichedAuthor extends Author {
  articleCount: number;
  recentArticles: BlogPost[];
}

export interface CategoryWithStats extends Category {
  articleCount: number;
  recentArticles: BlogPost[];
}

// Newsletter types for your 12 newsletters
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

// Category groupings for your 3-tier system
export type CategoryGroup = 'core' | 'specialized' | 'extended' | 'legacy';

export interface CategoryGrouping {
  core: Category[];
  specialized: Category[];
  extended: Category[];
  legacy?: Category[];
}