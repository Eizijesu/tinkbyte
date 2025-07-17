// src/lib/types/index.ts - Central type exports with explicit re-exports

// Comments system (your existing file) - export everything
export * from './comments';

// Core content types - avoid conflicts by being explicit
export type {
  Article,
  ArticleRead,
  ArticleLike,
  ArticleSave,
  ArticleFollow
} from './articles';

export type {
  Topic,
  UserTopicFollow
} from './topics';

export type {
  Author,
  AuthorFollow
} from './authors';

// User system types
export type {
  User,
  UserPreferences,
  UserSession
} from './users';

export type {
  UserProfile // Only if different from comments.ts
} from './profiles';

// Community features
export type {
  Thread,
  ThreadReply
} from './threads';

export type {
  UserFollow,
  UserFollowingPreferences
} from './follows';

// Subscription and payments
export type {
  Subscription,
  Payment
} from './subscriptions';

export type {
  Newsletter,
  NewsletterSubscription
} from './newsletters';

// Analytics and tracking
export type {
  UserActivity,
  UserActivityFeed,
  UserRateLimit
} from './analytics';

// Moderation system - rename to avoid conflicts
export type {
  ModerationRule,
  ModerationAction as SystemModerationAction // Rename to avoid conflict
} from './moderation';

// Authentication and sessions
export type {
  AuthConfig,
  EmailVerification
} from './auth';

// Common/shared types
export type {
  PaginationParams,
  PaginationResult,
  ApiResponse,
  FilterParams,
  TinkByteConfig
} from './common';