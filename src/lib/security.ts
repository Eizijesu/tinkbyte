// src/lib/security.ts
import { 
  COMMENT_CONFIG, 
  PROFANITY_WORDS, 
  SPAM_KEYWORDS, 
  SUSPICIOUS_PATTERNS,
  TECHNICAL_SPAM_PATTERNS 
} from './commentConfig';

export class ClientCommentValidator {
  /**
   * Client-side validation before sending to server
   */
  static validateComment(content: string, userReputation: number = 0): {
    valid: boolean;
    error?: string;
    warnings?: string[];
    sanitizedContent?: string;
  } {
    
    // Basic validation
    if (!content?.trim()) {
      return { valid: false, error: 'Comment cannot be empty' };
    }
    
    if (content.length < COMMENT_CONFIG.VALIDATION.MIN_CONTENT_LENGTH) {
      return { valid: false, error: 'Comment too short' };
    }
    
    if (content.length > COMMENT_CONFIG.SECURITY.MAX_CONTENT_LENGTH) {
      return { valid: false, error: 'Comment exceeds maximum length' };
    }
    
    // Sanitize content
    const sanitizedContent = this.sanitizeContent(content);
    
    // Basic spam detection
    const spamScore = this.calculateBasicSpamScore(sanitizedContent);
    const warnings: string[] = [];
    
    if (spamScore > 50) {
      warnings.push('Content may be flagged for review');
    }
    
    // Check for obvious spam patterns
    if (spamScore > 80) {
      return { 
        valid: false, 
        error: 'Content appears to be spam',
        sanitizedContent 
      };
    }
    
    return {
      valid: true,
      sanitizedContent,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  /**
   * Basic client-side sanitization
   */
  static sanitizeContent(content: string): string {
    if (!content) return '';
    
    let clean = content.trim();
    
    // Remove basic HTML (except allowed tags)
    const allowedTags = COMMENT_CONFIG.VALIDATION.ALLOWED_HTML_TAGS;
    const tagPattern = new RegExp(
      `<(?!\\/?(?:${allowedTags.join('|')})\\b)[^>]*>`, 
      'gi'
    );
    clean = clean.replace(tagPattern, '');
    
    // Remove script tags and dangerous content
    clean = clean
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    // Process URLs
    clean = this.processUrls(clean);
    
    return clean.substring(0, COMMENT_CONFIG.SECURITY.MAX_CONTENT_LENGTH);
  }
  
  /**
   * Process URLs for client-side filtering
   */
  private static processUrls(content: string): string {
    const trustedDomains = COMMENT_CONFIG.SECURITY.TRUSTED_DOMAINS;
    
    return content.replace(/https?:\/\/([^\s\/]+)[^\s]*/g, (match, domain) => {
      // Check for suspicious patterns
      if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(match))) {
        return '[link removed]';
      }
      
      // Keep trusted domains
      if (trustedDomains.some(trusted => domain.includes(trusted))) {
        return match;
      }
      
      // Keep other URLs but could mark them
      return match;
    });
  }
  
  /**
   * Basic spam score calculation
   */
  private static calculateBasicSpamScore(content: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    
    // Check spam keywords
    SPAM_KEYWORDS.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        score += 20;
      }
    });
    
    // Check technical spam patterns
    TECHNICAL_SPAM_PATTERNS.forEach(pattern => {
      if (pattern.test(content)) {
        score += 25;
      }
    });
    
    // Check profanity
    PROFANITY_WORDS.forEach(word => {
      if (lowerContent.includes(word)) {
        score += 15;
      }
    });
    
    // Check for excessive caps
    const capsRatio = this.calculateCapsRatio(content);
    if (capsRatio > COMMENT_CONFIG.VALIDATION.MAX_CAPS_PERCENTAGE) {
      score += 10;
    }
    
    // Check for excessive links
    const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    const wordCount = content.split(/\s+/).length;
    if (linkCount > 0 && linkCount / wordCount > 0.2) {
      score += 15;
    }
    
    return Math.min(100, score);
  }
  
  private static calculateCapsRatio(content: string): number {
    const letters = content.replace(/[^A-Za-z]/g, '');
    const caps = content.replace(/[^A-Z]/g, '');
    return letters.length > 0 ? caps.length / letters.length : 0;
  }
}

// Simple rate limiting for client-side
export class ClientRateLimiter {
  private static getStorageKey(identifier: string, action: string): string {
    return `rate_limit_${identifier}_${action}`;
  }
  
  static checkRateLimit(identifier: string, action: string = 'comment'): {
    allowed: boolean;
    resetTime?: Date;
    remaining?: number;
  } {
    const now = Date.now();
    const storageKey = this.getStorageKey(identifier, action);
    
    try {
      const stored = localStorage.getItem(storageKey);
      const attempts = stored ? JSON.parse(stored) : [];
      
      // Clean old attempts (older than 1 hour)
      const oneHourAgo = now - (60 * 60 * 1000);
      const validAttempts = attempts.filter((timestamp: number) => timestamp > oneHourAgo);
      
      // Check minute limit
      const oneMinuteAgo = now - (60 * 1000);
      const recentAttempts = validAttempts.filter((timestamp: number) => timestamp > oneMinuteAgo);
      
      const perMinute = COMMENT_CONFIG.RATE_LIMITING.COMMENTS_PER_MINUTE;
      const perHour = COMMENT_CONFIG.RATE_LIMITING.COMMENTS_PER_HOUR;
      
      if (recentAttempts.length >= perMinute) {
        return {
          allowed: false,
          resetTime: new Date(oneMinuteAgo + (60 * 1000)),
          remaining: 0
        };
      }
      
      if (validAttempts.length >= perHour) {
        return {
          allowed: false,
          resetTime: new Date(oneHourAgo + (60 * 60 * 1000)),
          remaining: 0
        };
      }
      
      // Add current attempt
      validAttempts.push(now);
      localStorage.setItem(storageKey, JSON.stringify(validAttempts));
      
      return {
        allowed: true,
        remaining: Math.min(
          perMinute - recentAttempts.length - 1,
          perHour - validAttempts.length - 1
        )
      };
      
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true }; // Fail open
    }
  }
}

// Security Monitor for client-side security events
export class SecurityMonitor {
  /**
   * Get client IP address (simplified for client-side)
   */
  static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      console.error('Failed to get client IP:', error);
      return 'unknown';
    }
  }

  /**
   * Get location from IP (simplified)
   */
  static async getLocationFromIP(ip: string): Promise<{ country: string; region?: string }> {
    try {
      // Using a free IP geolocation service
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      return {
        country: data.country_name || 'Unknown',
        region: data.region || undefined
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      return { country: 'Unknown' };
    }
  }

  /**
   * Advanced rate limiting with penalties
   */
  static async checkAdvancedRateLimit(
    identifier: string, 
    action: string, 
    options: { shortLimit: number; longLimit: number }
  ): Promise<{
    allowed: boolean;
    resetTime?: Date;
    remaining?: number;
    penalty?: boolean;
  }> {
    const now = Date.now();
    const storageKey = `advanced_rate_limit_${identifier}_${action}`;
    
    try {
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : { attempts: [], penalties: [] };
      
      // Clean old attempts (older than 1 hour)
      const oneHourAgo = now - (60 * 60 * 1000);
      data.attempts = data.attempts.filter((timestamp: number) => timestamp > oneHourAgo);
      
      // Check for active penalties
      data.penalties = data.penalties.filter((penalty: any) => penalty.until > now);
      
      if (data.penalties.length > 0) {
        const activePenalty = data.penalties[0];
        return {
          allowed: false,
          resetTime: new Date(activePenalty.until),
          penalty: true
        };
      }
      
      // Check short-term limit (last 5 minutes)
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      const recentAttempts = data.attempts.filter((timestamp: number) => timestamp > fiveMinutesAgo);
      
      if (recentAttempts.length >= options.shortLimit) {
        // Apply penalty - 15 minute lockout
        const penaltyUntil = now + (15 * 60 * 1000);
        data.penalties.push({ until: penaltyUntil, reason: 'short_term_limit' });
        
        localStorage.setItem(storageKey, JSON.stringify(data));
        
        return {
          allowed: false,
          resetTime: new Date(penaltyUntil),
          penalty: true
        };
      }
      
      // Check long-term limit (last hour)
      if (data.attempts.length >= options.longLimit) {
        return {
          allowed: false,
          resetTime: new Date(oneHourAgo + (60 * 60 * 1000)),
          remaining: 0
        };
      }
      
      // Add current attempt
      data.attempts.push(now);
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      return {
        allowed: true,
        remaining: Math.min(
          options.shortLimit - recentAttempts.length - 1,
          options.longLimit - data.attempts.length
        )
      };
      
    } catch (error) {
      console.error('Advanced rate limit check failed:', error);
      return { allowed: true }; // Fail open
    }
  }

  /**
   * Log security events (client-side simplified version)
   */
  static async logSecurityEvent(
    userId: string | null,
    eventType: string,
    details: any
  ): Promise<void> {
    try {
      // In a real implementation, you'd send this to your backend
      console.log('Security Event:', {
        userId,
        eventType,
        details,
        timestamp: new Date().toISOString()
      });
      
      // Store locally for debugging (optional)
      const events = JSON.parse(localStorage.getItem('security_events') || '[]');
      events.push({
        userId,
        eventType,
        details,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 events
      if (events.length > 50) {
        events.splice(0, events.length - 50);
      }
      
      localStorage.setItem('security_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}