// src/lib/commentConfig.ts
export const COMMENT_CONFIG = {
    VALIDATION: {
      MIN_CONTENT_LENGTH: 3,
      MAX_CAPS_PERCENTAGE: 0.7, // 70% caps is considered excessive
      ALLOWED_HTML_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre'],
      MIN_READABILITY_SCORE: 25,
      MAX_LINK_DENSITY: 0.3,
    },
    
    SECURITY: {
      MAX_CONTENT_LENGTH: 2000,
      ENABLE_HTML_SANITIZATION: true,
      ENABLE_URL_FILTERING: true,
      ENABLE_PROFANITY_FILTER: true,
      ENABLE_BEHAVIORAL_ANALYSIS: true,
      TRUSTED_DOMAINS: [
        'github.com', 'stackoverflow.com', 'developer.mozilla.org',
        'docs.microsoft.com', 'aws.amazon.com', 'cloud.google.com',
        'npmjs.com', 'pypi.org', 'docker.com', 'kubernetes.io',
        'reactjs.org', 'vuejs.org', 'angular.io', 'nodejs.org'
      ],
    },
    
    THREADING: {
      MAX_DEPTH: 3,
      ENABLE_NESTED_REPLIES: true,
    },
    
    MENTIONS: {
      MAX_MENTIONS_PER_COMMENT: 5,
      ENABLE_MENTION_NOTIFICATIONS: true,
    },
    
    MODERATION: {
      AUTO_APPROVE_THRESHOLD: 50, // Reputation score
      AUTO_APPROVE_HIGH_REP: 100, // High reputation auto-approve
      ENABLE_AUTO_MODERATION: true,
      PROFANITY_ACTION: 'flag', // 'flag', 'reject', 'pending'
      SPAM_THRESHOLD: 70,
      REVIEW_THRESHOLD: 40,
      BEHAVIORAL_RISK_THRESHOLD: 50,
    },
    
    RATE_LIMITING: {
      COMMENTS_PER_MINUTE: 5,
      COMMENTS_PER_HOUR: 30,
      COMMENTS_PER_DAY: 100,
      PROGRESSIVE_PENALTY: true,
    },
  
    CONTENT_ANALYSIS: {
      ENABLE_SENTIMENT_ANALYSIS: true,
      ENABLE_TECHNICAL_RELEVANCE: true,
      ENABLE_LANGUAGE_DETECTION: true,
      SUPPORTED_LANGUAGES: ['en'],
      TECHNICAL_KEYWORDS: [
        'api', 'framework', 'library', 'database', 'algorithm',
        'architecture', 'deployment', 'testing', 'debugging',
        'performance', 'security', 'scalability', 'microservices',
        'devops', 'cicd', 'docker', 'kubernetes', 'aws', 'azure',
        'react', 'vue', 'angular', 'nodejs', 'python', 'javascript',
        'typescript', 'rust', 'go', 'java', 'c++', 'sql', 'nosql'
      ],
    }
  } as const;
  
  // Enhanced profanity and spam detection
  export const PROFANITY_WORDS = [
    'spam', 'scam', 'fake', 'bullshit', 'damn', 'crap',
    'clickbait', 'garbage', 'trash', 'stupid', 'idiot',
    'moron', 'dumb', 'retard', 'gay', 'lame'
  ] as const;
  
  export const SPAM_KEYWORDS = [
    'buy now', 'click here', 'limited time', 'act now',
    'free money', 'make money fast', 'earn $', 'work from home',
    'no experience required', 'guaranteed income', 'double your money',
    'risk free', 'cash now', 'urgent', 'congratulations',
    'you have won', 'claim your prize', 'nigerian prince',
    'inheritance', 'lottery winner', 'seo services',
    'app development outsourcing', 'blockchain investment',
    'crypto trading', 'forex trading', 'binary options',
    'get rich quick', 'passive income', 'financial freedom',
    'exclusive offer', 'limited slots', 'hurry up',
    'dont miss out', 'amazing opportunity', 'revolutionary system'
  ] as const;
  
  export const SUSPICIOUS_PATTERNS = [
    /bit\.ly/gi, /tinyurl/gi, /t\.co/gi, /goo\.gl/gi,
    /ow\.ly/gi, /short\.link/gi, /tiny\.cc/gi,
    /cutt\.ly/gi, /rebrand\.ly/gi, /is\.gd/gi
  ] as const;
  
  export const TECHNICAL_SPAM_PATTERNS = [
    /hire\s+developers?\s+(cheap|offshore|india|pakistan)/gi,
    /outsource\s+your\s+development/gi,
    /we\s+can\s+build\s+your\s+app/gi,
    /contact\s+us\s+for\s+development/gi,
    /professional\s+web\s+development\s+services/gi,
    /increase\s+your\s+website\s+traffic/gi,
    /boost\s+your\s+seo\s+ranking/gi,
    /guaranteed\s+first\s+page\s+google/gi
  ] as const;
  
  // Type definitions
  export type CommentValidationRule = keyof typeof COMMENT_CONFIG.VALIDATION;
  export type CommentSecurityRule = keyof typeof COMMENT_CONFIG.SECURITY;
  export type CommentModerationRule = keyof typeof COMMENT_CONFIG.MODERATION;
  
  export interface ValidationContext {
    userReputation?: number;
    isVerified?: boolean;
    userId?: string;
    sessionInfo?: SessionInfo;
  }
  
  export interface ValidationResult {
    valid: boolean;
    error?: string;
    warnings?: string[];
    severity?: 'error' | 'warning' | 'info';
    requiresReview?: boolean;
    spamScore?: number;
  }
  
  export interface ContentAnalysis {
    warnings: string[];
    metrics: {
      capsRatio: number;
      linkDensity: number;
      readability: number;
      technicalRelevance: number;
      sentimentScore?: number;
    };
  }
  
  export interface ProcessingResult {
    success: boolean;
    content?: string;
    error?: string;
    action?: 'auto_approve' | 'manual_review' | 'auto_approve_with_monitoring' | 'reject';
    requiresReview?: boolean;
    spamScore?: number;
  }
  
  export interface SessionInfo {
    ip?: string;
    userAgent?: string;
    country?: string;
    fingerprint?: string;
  }
  
  export interface UserContext {
    reputation: number;
    isVerified: boolean;
    accountAge: number;
    commentHistory: number;
  }
  
  export interface SanitizeOptions {
    allowTrustedDomains?: boolean;
    maxLength?: number;
    preserveFormatting?: boolean;
    allowedTags?: string[];
  }