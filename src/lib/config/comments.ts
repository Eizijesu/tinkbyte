// src/lib/config/comments.ts - Complete config
export const COMMENT_CONFIG = {
  // Threading
  maxThreadDepth: 5,
  mobileMaxDepth: 2,
  collapseAfter: 3,
  
  // Pagination
  initialLoad: 20,
  pageSize: 20,
  repliesPerComment: 10,
  repliesPageSize: 5,
  
  // Performance
  maxCommentsBeforeVirtualization: 100,
  virtualScrollBuffer: 5,
  
  // Rate Limiting
  rateLimits: {
    free: { comments: 5, window: 60 },
    premium: { comments: 15, window: 60 },
    admin: { comments: 100, window: 60 }
  },
  
  // UI
  animationDuration: 300,
  autoSaveDelay: 2000,
  characterLimits: {
    min: 2,
    max: 1000,
    warning: 800
  },
  
  // Edit/Delete settings
  editWindowHours: 24,
  allowDelete: true,
  allowEdit: true,
  trackEditHistory: true,
  
  editReasons: [  // Remove as const here
    'Fix typo',
    'Clarify meaning', 
    'Add information',
    'Remove sensitive info',
    'Other'
  ],
  
  // Moderation
  autoApprove: true,
  requireModeration: false,
  spamDetection: true,
  
  // Features
  enableReactions: true,
  enableMentions: true,
  enableBookmarks: true,
  enableDrafts: true,
  
  // Mobile optimizations
  mobile: {
    maxThreadDepth: 2,
    initialLoad: 15,
    pageSize: 8,
    repliesPageSize: 3,
    hideDeepThreads: true
  },

  // Additional properties needed by helpers
  THREADING: {
    MAX_DEPTH: 4
  },
  
  VALIDATION: {
    MIN_CONTENT_LENGTH: 2,
    MAX_CAPS_PERCENTAGE: 0.7
  },
  
  SECURITY: {
    MAX_CONTENT_LENGTH: 1000
  },
  
  MENTIONS: {
    MAX_MENTIONS_PER_COMMENT: 5
  },
  
  MODERATION: {
    AUTO_APPROVE_HIGH_REP: 1000,
    AUTO_APPROVE_THRESHOLD: 100,
    SPAM_THRESHOLD: 70,
    REVIEW_THRESHOLD: 40
  },
  
  RATE_LIMITING: {
    COMMENTS_PER_MINUTE: 5
  }
}; // Remove as const from here

export const THREAD_COLORS = {
  light: [
    '#6366f1', // Level 1 - Indigo
    '#10b981', // Level 2 - Emerald  
    '#f59e0b', // Level 3 - Amber
    '#ef4444', // Level 4 - Red
    '#8b5cf6'  // Level 5 - Violet
  ],
  dark: [
    '#818cf8', // Level 1 - Indigo (lighter)
    '#34d399', // Level 2 - Emerald (lighter)
    '#fbbf24', // Level 3 - Amber (lighter)
    '#f87171', // Level 4 - Red (lighter)
    '#a78bfa'  // Level 5 - Violet (lighter)
  ]
} as const; // Keep as const here since it's used for type inference

export const REACTION_TYPES = {
  helpful: { emoji: '👍', label: 'Helpful' },
  insightful: { emoji: '💡', label: 'Insightful' },
  great: { emoji: '🔥', label: 'Great' },
  love: { emoji: '❤️', label: 'Love' },
  thinking: { emoji: '🤔', label: 'Thinking' }
} as const; // Keep as const here since it's used for type inference

export const AVATAR_PRESETS = [
  '/images/avatars/preset-1.svg',
  '/images/avatars/preset-2.svg',
  '/images/avatars/preset-3.svg',
  '/images/avatars/preset-4.svg',
  '/images/avatars/preset-5.svg',
  '/images/avatars/preset-6.svg'
]; // Remove as const here if you need it to be mutable

// Export types
export type ThreadColor = typeof THREAD_COLORS;
export type ReactionType = keyof typeof REACTION_TYPES;
export type AvatarPreset = typeof AVATAR_PRESETS[number];