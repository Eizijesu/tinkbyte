// src/lib/utils/moderation.ts
import { supabase, db, rpc } from '../supabase';

// Types for moderation
export interface ModerationResult {
  status: 'auto_approved' | 'pending' | 'flagged' | 'rejected';
  reason?: string;
  confidence?: number;
}

export interface ModerationRules {
  flaggedKeywords: string[];
  spamPatterns: RegExp[];
  linkPatterns: RegExp[];
  profanityWords: string[];
}

// Default moderation rules
const DEFAULT_RULES: ModerationRules = {
  flaggedKeywords: [
    'spam', 'scam', 'click here', 'buy now', 'free money', 'make money fast',
    'limited time', 'act now', 'urgent', 'congratulations you won'
  ],
  spamPatterns: [
    /(.)\1{4,}/g, // Repeated characters (aaaaa)
    /[A-Z]{10,}/g, // Excessive caps
    /\b\w*\d+\w*\d+\w*\b/g, // Multiple numbers in words
  ],
  linkPatterns: [
    /https?:\/\/[^\s]+/gi,
    /www\.[^\s]+/gi,
    /[a-zA-Z0-9-]+\.(com|net|org|io|co|me)[^\s]*/gi
  ],
  profanityWords: [
    // Add your profanity list here
    'badword1', 'badword2' // Replace with actual words
  ]
};

// Cache for moderation rules
let cachedRules: ModerationRules | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Main auto-moderation function
export const determineCommentStatus = async (
  content: string, 
  user: any,
  articleId?: string
): Promise<ModerationResult> => {
  try {
    // Check if user is blocked
    if (user && await isUserBlocked(user.id)) {
      return { 
        status: 'rejected', 
        reason: 'User is blocked',
        confidence: 1.0
      };
    }

    // Get user reputation and history
    const userMetrics = user ? await getUserModerationMetrics(user.id) : null;
    
    // Auto-approve trusted users
    if (userMetrics && await isTrustedUser(userMetrics)) {
      return { 
        status: 'auto_approved', 
        reason: 'Trusted user',
        confidence: 0.95
      };
    }

    // Content analysis
    const contentAnalysis = await analyzeContent(content);
    
    // Apply moderation rules
    if (contentAnalysis.isSpam) {
      return { 
        status: 'flagged', 
        reason: 'Detected spam content',
        confidence: contentAnalysis.spamConfidence
      };
    }

    if (contentAnalysis.hasProfanity) {
      return { 
        status: 'pending', 
        reason: 'Contains inappropriate language',
        confidence: contentAnalysis.profanityConfidence
      };
    }

    if (contentAnalysis.hasLinks && (!user || userMetrics?.reputation < 50)) {
      return { 
        status: 'pending', 
        reason: 'Links require manual review for new users',
        confidence: 0.8
      };
    }

    // New user checks
    if (!user || await isNewUser(user.id)) {
      return { 
        status: 'pending', 
        reason: 'New user requires manual review',
        confidence: 0.7
      };
    }

    // Auto-approve for established users
    if (user && user.email_verified && userMetrics?.reputation >= 25) {
      return { 
        status: 'auto_approved', 
        reason: 'Established user with good reputation',
        confidence: 0.9
      };
    }

    // Default to pending for safety
    return { 
      status: 'pending', 
      reason: 'Default manual review',
      confidence: 0.6
    };

  } catch (error) {
    console.error('Moderation error:', error);
    // Fail safe - require manual review
    return { 
      status: 'pending', 
      reason: 'Moderation system error',
      confidence: 0.5
    };
  }
};

// Content analysis function
async function analyzeContent(content: string): Promise<{
  isSpam: boolean;
  hasProfanity: boolean;
  hasLinks: boolean;
  spamConfidence: number;
  profanityConfidence: number;
}> {
  const rules = await getModerationRules();
  const lowerContent = content.toLowerCase();
  
  // Check for spam patterns
  let spamScore = 0;
  let spamChecks = 0;

  // Keyword check
  const flaggedKeywordCount = rules.flaggedKeywords.filter(keyword => 
    lowerContent.includes(keyword)
  ).length;
  spamScore += flaggedKeywordCount * 0.3;
  spamChecks++;

  // Pattern checks
  rules.spamPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      spamScore += 0.4;
    }
    spamChecks++;
  });

  // Length and quality checks
  if (content.length < 10) {
    spamScore += 0.2; // Very short comments
  }
  if (content.length > 2000) {
    spamScore += 0.3; // Extremely long comments
  }
  spamChecks += 2;

  // Link detection
  const hasLinks = rules.linkPatterns.some(pattern => pattern.test(content));
  if (hasLinks) {
    spamScore += 0.2;
  }

  // Profanity check
  const profanityCount = rules.profanityWords.filter(word => 
    lowerContent.includes(word)
  ).length;
  
  const spamConfidence = Math.min(spamScore / spamChecks, 1.0);
  const profanityConfidence = Math.min(profanityCount * 0.5, 1.0);

  return {
    isSpam: spamConfidence > 0.6,
    hasProfanity: profanityConfidence > 0.3,
    hasLinks,
    spamConfidence,
    profanityConfidence
  };
}

// Get moderation rules (with caching)
async function getModerationRules(): Promise<ModerationRules> {
  const now = Date.now();
  
  if (cachedRules && now < cacheExpiry) {
    return cachedRules;
  }

  try {
    // Try to fetch from database
    const { data: dbRules } = await db.moderationRules()
      .select('*')
      .eq('is_active', true);
      
    if (dbRules && dbRules.length > 0) {
      cachedRules = {
        flaggedKeywords: dbRules.filter(r => r.rule_type === 'keyword').map(r => r.rule_config.value),
        spamPatterns: dbRules.filter(r => r.rule_type === 'pattern').map(r => new RegExp(r.rule_config.value, 'gi')),
        linkPatterns: dbRules.filter(r => r.rule_type === 'link').map(r => new RegExp(r.rule_config.value, 'gi')),
        profanityWords: dbRules.filter(r => r.rule_type === 'profanity').map(r => r.rule_config.value)
      };
    } else {
      cachedRules = DEFAULT_RULES;
    }
  } catch (error) {
    console.error('Failed to fetch moderation rules:', error);
    cachedRules = DEFAULT_RULES;
  }

  cacheExpiry = now + CACHE_TTL;
  return cachedRules;
}

// Check if user is new (less than 7 days or few comments)
async function isNewUser(userId: string): Promise<boolean> {
  try {
    const { data: profile } = await db.profiles()
      .select('created_at, total_comments')
      .eq('id', userId)
      .single();

    if (!profile) return true;

    const accountAge = Date.now() - new Date(profile.created_at).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    return accountAge < sevenDays || (profile.total_comments || 0) < 5;
  } catch (error) {
    console.error('Error checking if user is new:', error);
    return true; // Err on the side of caution
  }
}

// Check if user is trusted
async function isTrustedUser(metrics: any): Promise<boolean> {
  return (
    metrics.reputation >= 100 &&
    metrics.approvalRate >= 0.9 &&
    metrics.totalComments >= 50 &&
    !metrics.hasRecentFlags
  );
}

// Get user moderation metrics
async function getUserModerationMetrics(userId: string): Promise<any> {
  try {
    const { data: profile } = await db.profiles()
      .select('reputation_score, total_comments, created_at')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    // Get comment approval stats
    const { data: comments } = await db.comments()
      .select('moderation_status, created_at')
      .eq('user_id', userId)
      .limit(100);

    const totalComments = comments?.length || 0;
    const approvedComments = comments?.filter(c => 
      c.moderation_status === 'approved' || c.moderation_status === 'auto_approved'
    ).length || 0;

    // Check for recent flags
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: recentFlags } = await db.commentModeration()
      .select('action')
      .eq('user_id', userId) // Fixed: should be user_id not comment_id
      .gte('created_at', thirtyDaysAgo.toISOString())
      .in('action', ['flag', 'hide', 'delete']);

    return {
      reputation: profile.reputation_score || 0,
      totalComments: profile.total_comments || 0,
      approvalRate: totalComments > 0 ? approvedComments / totalComments : 0,
      hasRecentFlags: (recentFlags?.length || 0) > 0,
      accountAge: Date.now() - new Date(profile.created_at).getTime()
    };
  } catch (error) {
    console.error('Error getting user metrics:', error);
    return null;
  }
}

// Check if user is blocked
async function isUserBlocked(userId: string): Promise<boolean> {
  try {
    const { data: profile } = await db.profiles()
      .select('is_blocked, blocked_until')
      .eq('id', userId)
      .single();

    if (!profile?.is_blocked) return false;

    // Check if temporary block has expired
    if (profile.blocked_until && new Date(profile.blocked_until) < new Date()) {
      // Auto-unblock
      await db.profiles()
        .update({ is_blocked: false, blocked_until: null })
        .eq('id', userId);
      return false;
    }

    return profile.is_blocked;
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
}

// Helper function to get flagged keywords (for backward compatibility)
export async function getFlaggedKeywords(): Promise<string[]> {
  const rules = await getModerationRules();
  return rules.flaggedKeywords;
}

// Admin function to update moderation rules
export async function updateModerationRules(rules: Partial<ModerationRules>): Promise<void> {
  // Clear cache
  cachedRules = null;
  cacheExpiry = 0;
  
  // Update database rules
  // Implementation depends on your moderation_rules table structure
}

// Export for use in other files
export { isNewUser, getUserModerationMetrics, isUserBlocked };