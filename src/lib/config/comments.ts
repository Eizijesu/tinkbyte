// src/lib/config/comments.ts
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
  
  editReasons: [
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
};

// Move REACTION_TYPES to the main config
export const REACTION_TYPES = {
  helpful: { emoji: '👍', label: 'Helpful' },
  //insightful: { emoji: '💡', label: 'Insightful' },
  //great: { emoji: '🔥', label: 'Great' },
  love: { emoji: '❤️', label: 'Love' },
  //thinking: { emoji: '🤔', label: 'Thinking' }
} as const;

export const THREAD_COLORS = {
  light: [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
  ],
  dark: [
    '#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'
  ]
} as const;

export const AVATAR_PRESETS = [
  '/images/avatars/preset-1.svg',
  '/images/avatars/preset-2.svg',
  '/images/avatars/preset-3.svg',
  '/images/avatars/preset-4.svg',
  '/images/avatars/preset-5.svg',
  '/images/avatars/preset-6.svg'
];

// Export types
export type ThreadColor = typeof THREAD_COLORS;
export type ReactionType = keyof typeof REACTION_TYPES;
export type AvatarPreset = typeof AVATAR_PRESETS[number];