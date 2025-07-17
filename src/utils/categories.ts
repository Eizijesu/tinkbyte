// src/utils/categories.ts
export const CATEGORY_CONFIG = {
    // Core Themes
    'build-thinking': {
      name: 'Build Thinking',
      description: 'Mental models, product intuition, systems mindset',
      icon: 'hammer',
      color: 'blue',
      theme: 'core'
    },
    'learning-by-doing': {
      name: 'Learning by Doing', 
      description: 'Practical experiments, hands-on growth',
      icon: 'book',
      color: 'green',
      theme: 'core'
    },
    'fail-iterate-ship': {
      name: 'Fail / Iterate / Ship',
      description: 'Process-focused iteration and reflection',
      icon: 'repeat',
      color: 'orange', 
      theme: 'core'
    },
    'product-lessons': {
      name: 'Product Lessons',
      description: 'Real build stories, what worked/didn\'t',
      icon: 'lightbulb',
      color: 'purple',
      theme: 'core'
    },
    'startup-insight': {
      name: 'Startup Insight',
      description: 'Early-stage execution, traction, team dynamics',
      icon: 'rocket',
      color: 'red',
      theme: 'core'
    },
    'product-strategy': {
      name: 'Product Strategy',
      description: 'Positioning, roadmap thinking, growth decisions',
      icon: 'target',
      color: 'indigo',
      theme: 'core'
    },
    
    // Specialized Themes
    'ai-evolution': {
      name: 'AI Evolution',
      description: 'Practical AI implementation, ethical considerations',
      icon: 'brain',
      color: 'violet',
      theme: 'specialized'
    },
    'developer-stack-tools': {
      name: 'Developer Stack & Tools',
      description: 'Tooling, platforms, workflows, engineering stacks',
      icon: 'tools',
      color: 'emerald',
      theme: 'specialized'
    },
    'research-bites': {
      name: 'Research Bites',
      description: 'Quick insights, data analysis, market intelligence',
      icon: 'chart',
      color: 'pink',
      theme: 'specialized'
    },
    'system-thinking': {
      name: 'System Thinking',
      description: 'Holistic approaches, interconnected solutions',
      icon: 'network',
      color: 'emerald',
      theme: 'specialized'
    },
    'the-interface': {
      name: 'The Interface',
      description: 'Human-computer interaction, design patterns',
      icon: 'screen',
      color: 'blue',
      theme: 'specialized'
    },
    'tech-culture': {
      name: 'Tech Culture',
      description: 'Industry dynamics, team culture, remote work',
      icon: 'users',
      color: 'pink',
      theme: 'specialized'
    },
    'global-perspective': {
      name: 'Global Perspective',
      description: 'International markets, cross-cultural insights',
      icon: 'globe',
      color: 'cyan',
      theme: 'specialized'
    },
    'community-innovation': {
      name: 'Community Innovation',
      description: 'Open source, collaborative development, ecosystems',
      icon: 'community',
      color: 'green',
      theme: 'specialized'
    },
    
    // Extended Themes
    'career-stacks': {
      name: 'Career Stacks',
      description: 'Professional growth, skill development, career paths',
      icon: 'ladder',
      color: 'red',
      theme: 'extended'
    },
    'future-stacks': {
      name: 'Future Stacks',
      description: 'Emerging technologies, next-gen platforms',
      icon: 'crystal-ball',
      color: 'violet',
      theme: 'extended'
    },
    'creator-economy': {
      name: 'Creator Economy',
      description: 'Content creation, monetization, platform dynamics',
      icon: 'creator',
      color: 'pink',
      theme: 'extended'
    },
    'business-models-monetization': {
      name: 'Business Models & Monetization',
      description: 'Revenue strategies, pricing models, market fit',
      icon: 'dollar',
      color: 'indigo',
      theme: 'extended'
    },
    'consumer-behavior-attention': {
      name: 'Consumer Behavior & Attention',
      description: 'User psychology, engagement patterns, retention',
      icon: 'eye',
      color: 'cyan',
      theme: 'extended'
    },
    'ecosystem-shifts-market-maps': {
      name: 'Ecosystem Shifts & Market Maps',
      description: 'Industry analysis, competitive landscapes, trends',
      icon: 'map',
      color: 'emerald',
      theme: 'extended'
    },
    'people-systems': {
      name: 'People Systems',
      description: 'Team dynamics, organizational design, leadership',
      icon: 'organization',
      color: 'orange',
      theme: 'extended'
    }
  } as const;
  
  export type CategorySlug = keyof typeof CATEGORY_CONFIG;
  export type CategoryTheme = 'core' | 'specialized' | 'extended';
  
  export function getCategoryConfig(slug: CategorySlug) {
    return CATEGORY_CONFIG[slug];
  }
  
  export function getCategoriesByTheme(theme: CategoryTheme) {
    return Object.entries(CATEGORY_CONFIG)
      .filter(([_, config]) => config.theme === theme)
      .map(([slug, config]) => ({ slug: slug as CategorySlug, ...config }));
  }
  
  export function getAllCategoryThemes(): CategoryTheme[] {
    return ['core', 'specialized', 'extended'];
  }