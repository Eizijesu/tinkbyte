// src/lib/content/quality-simple.ts - Simple content quality checks
export const CONTENT_GUIDELINES = {
  // Words to avoid (keep it simple)
  buzzwords: [
    'game-changer', 'revolutionary', 'disruptive', 'paradigm shift',
    'synergy', 'leverage', 'optimize', 'unlock', 'deep dive'
  ],
  
  // Positive indicators
  qualityIndicators: [
    'example', 'case study', 'lesson', 'experience', 'story',
    'practical', 'real', 'actual', 'specific', 'concrete'
  ],
  
  // Target audience keywords
  audienceKeywords: [
    'builder', 'maker', 'founder', 'developer', 'product',
    'startup', 'team', 'engineer', 'designer'
  ]
};

export function checkContentQuality(title: string, excerpt: string): {
  score: number;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let score = 100;
  
  const text = (title + ' ' + excerpt).toLowerCase();
  
  // Check for buzzwords
  const foundBuzzwords = CONTENT_GUIDELINES.buzzwords.filter(word => 
    text.includes(word.toLowerCase())
  );
  
  if (foundBuzzwords.length > 0) {
    score -= foundBuzzwords.length * 10;
    suggestions.push(`Avoid buzzwords: ${foundBuzzwords.join(', ')}`);
  }
  
  // Check for quality indicators
  const hasQualityIndicators = CONTENT_GUIDELINES.qualityIndicators.some(word => 
    text.includes(word)
  );
  
  if (!hasQualityIndicators) {
    score -= 15;
    suggestions.push('Consider adding examples or case studies');
  }
  
  // Check for target audience
  const hasAudienceKeywords = CONTENT_GUIDELINES.audienceKeywords.some(word => 
    text.includes(word)
  );
  
  if (!hasAudienceKeywords) {
    score -= 10;
    suggestions.push('Consider mentioning your target audience (builders, founders, etc.)');
  }
  
  return { score: Math.max(0, score), suggestions };
}