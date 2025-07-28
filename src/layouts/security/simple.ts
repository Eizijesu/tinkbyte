// src/lib/security/simple.ts - MINIMAL security for static sites
export const SECURITY_CONFIG = {
  // Simple rate limits
  rateLimits: {
    newsletter: { requests: 3, window: 300000 }, // 3 signups per 5 minutes
    contact: { requests: 2, window: 600000 },    // 2 contact forms per 10 minutes
    search: { requests: 30, window: 60000 },     // 30 searches per minute
  },
  
  // Basic content validation
  maxContentLength: 5000, // 5KB max for forms
  
  // Simple blocked patterns (only the obvious ones)
  blockedPatterns: [
    /<script/i,
    /javascript:/i,
    /on\w+=/i
  ]
};

// Simple validation function
export function validateInput(input: string): boolean {
  if (input.length > SECURITY_CONFIG.maxContentLength) return false;
  
  return !SECURITY_CONFIG.blockedPatterns.some(pattern => 
    pattern.test(input)
  );
}

// Simple rate limiting for forms
const formSubmissions = new Map<string, number[]>();

export function checkFormRateLimit(identifier: string, type: keyof typeof SECURITY_CONFIG.rateLimits): boolean {
  const now = Date.now();
  const config = SECURITY_CONFIG.rateLimits[type];
  
  if (!formSubmissions.has(identifier)) {
    formSubmissions.set(identifier, []);
  }
  
  const submissions = formSubmissions.get(identifier)!;
  const recent = submissions.filter(time => now - time < config.window);
  
  if (recent.length >= config.requests) {
    return false; // Rate limited
  }
  
  recent.push(now);
  formSubmissions.set(identifier, recent);
  return true;
}