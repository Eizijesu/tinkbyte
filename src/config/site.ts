// src/config/site.ts - Complete TinkByte configuration
export const SITE = {
  name: 'TinkByte',
  title: 'TinkByte | Digital Tech Innovation Weekly',
  description: 'TinkByte delivers practical tech insights and innovation analysis without the hype. Weekly articles on AI, product development, and emerging technologies for builders who value substance.',
  url: 'https://tinkbyte.com',
  author: 'TinkByte Team',
  locale: 'en-US',
  
  // Enhanced brand identity
  brand: {
    primary: '#243788',
    secondary: '#b4bce1',
    dark: '#1a2b5c',
    light: '#e8ebf4',
    gradient: 'from-blue-600 to-purple-600',
  },
  
  // Complete social media presence
  social: {
    twitter: '@tinkbytehq',
    youtube: '@tinkbytehq',
    linkedin: 'company/tinkbytehq',
    instagram: '@tinkbytehq',
    tiktok: '@tinkbytehq',
    github: 'tinkbyte',
    email: 'feedback@tinkbyte.com',
    discord: 'tinkbyte',
    telegram: 'tinkbytehq',
    substack: 'tinkbyte',
    medium: '@tinkbyte',
    devto: 'tinkbyte',
    hashnode: '@tinkbyte'
  },

  // Your 12 Newsletter Types
  newsletters: {
    // Weekly Publications (5)
    weekly: [
      {
        name: 'TinkByte Weekly',
        slug: 'tinkbyte-weekly',
        description: 'Core weekly digest covering all major tech developments',
        frequency: 'Weekly on Tuesdays',
        audience: 'All subscribers',
        contentMix: 'News, analysis, tools, and insights',
        active: true
      },
      {
        name: 'Build Sheet',
        slug: 'build-sheet',
        description: 'Practical building guides and development insights',
        frequency: 'Weekly on Wednesdays',
        audience: 'Developers and builders',
        contentMix: 'Tutorials, frameworks, and build processes',
        active: true
      },
      {
        name: 'StackDown',
        slug: 'stackdown',
        description: 'Deep dives into technology stacks and architecture',
        frequency: 'Weekly on Thursdays',
        audience: 'Technical architects and senior developers',
        contentMix: 'Stack analysis, architecture patterns, and tech decisions',
        active: true
      },
      {
        name: 'Signal Drop',
        slug: 'signal-drop',
        description: 'Market signals and industry trend analysis',
        frequency: 'Weekly on Fridays',
        audience: 'Product managers and founders',
        contentMix: 'Market trends, startup news, and business insights',
        active: true
      },
      {
        name: 'System Signal',
        slug: 'system-signal',
        description: 'Systems thinking and organizational insights',
        frequency: 'Weekly on Mondays',
        audience: 'Leaders and system thinkers',
        contentMix: 'Organizational design, systems, and leadership',
        active: true
      }
    ],
    
    // Monthly Deep Dives (6)
    monthly: [
      {
        name: 'The Real Build',
        slug: 'the-real-build',
        description: 'In-depth product development case studies',
        frequency: 'Monthly - First Tuesday',
        audience: 'Product builders and entrepreneurs',
        contentMix: 'Case studies, failure stories, and build processes',
        active: true
      },
      {
        name: 'The Loop',
        slug: 'the-loop',
        description: 'Feedback loops and iteration strategies',
        frequency: 'Monthly - Second Tuesday',
        audience: 'Agile practitioners and product teams',
        contentMix: 'Iteration strategies, feedback systems, and improvement cycles',
        active: true
      },
      {
        name: 'Data Slice',
        slug: 'data-slice',
        description: 'Data-driven insights and analytics deep dives',
        frequency: 'Monthly - Third Tuesday',
        audience: 'Data professionals and analysts',
        contentMix: 'Data analysis, metrics, and research findings',
        active: true
      },
      {
        name: 'The Mirror',
        slug: 'the-mirror',
        description: 'Global tech perspectives and cultural insights',
        frequency: 'Monthly - Fourth Tuesday',
        audience: 'Global tech community',
        contentMix: 'Cultural perspectives, global trends, and diverse viewpoints',
        active: true
      },
      {
        name: 'Community Code',
        slug: 'community-code',
        description: 'Community building and collaboration insights',
        frequency: 'Monthly - First Wednesday',
        audience: 'Community builders and open source contributors',
        contentMix: 'Community strategies, collaboration tools, and social dynamics',
        active: true
      },
      {
        name: 'Career Stack',
        slug: 'career-stack',
        description: 'Career development and professional growth',
        frequency: 'Monthly - Second Wednesday',
        audience: 'Tech professionals at all levels',
        contentMix: 'Career advice, skill development, and industry navigation',
        active: true
      }
    ],
    
    // Limited Series (1)
    limitedSeries: [
      {
        name: 'Start Here: Future Tech',
        slug: 'start-here-future-tech',
        description: 'Beginner-friendly introduction to emerging technologies',
        frequency: 'Limited Series - 12 parts',
        audience: 'Tech newcomers and curious professionals',
        contentMix: 'Educational content, fundamentals, and future predictions',
        active: true,
        totalIssues: 12,
        currentIssue: 8
      }
    ]
  },

  // Your Complete 21 Categories System
  categories: {
    // Core Themes (6)
    core: [
      {
        name: 'Build Thinking',
        slug: 'build-thinking',
        description: 'How products actually get made - practical insights from the trenches',
        icon: 'hammer',
        color: 'blue',
        gradient: 'from-blue-500 to-cyan-600',
        featured: true
      },
      {
        name: 'Learning by Doing',
        slug: 'learning-by-doing',
        description: 'Real lessons from failures, MVPs, and successful launches',
        icon: 'book',
        color: 'green',
        gradient: 'from-green-500 to-emerald-600',
        featured: true
      },
      {
        name: 'Fail, Iterate, Ship',
        slug: 'fail-iterate-ship',
        description: 'The reality of building products - failures, iterations, and shipping',
        icon: 'repeat',
        color: 'orange',
        gradient: 'from-orange-500 to-red-600',
        featured: true
      },
      {
        name: 'Product Lessons',
        slug: 'product-lessons',
        description: 'Hard-won insights from product development and management',
        icon: 'lightbulb',
        color: 'yellow',
        gradient: 'from-yellow-500 to-orange-600',
        featured: true
      },
      {
        name: 'Startup Insight',
        slug: 'startup-insight',
        description: 'Entrepreneurship, scaling, and lessons from the startup trenches',
        icon: 'rocket',
        color: 'purple',
        gradient: 'from-purple-500 to-indigo-600',
        featured: true
      },
      {
        name: 'Product Strategy',
        slug: 'product-strategy',
        description: 'Strategic thinking about product development and market fit',
        icon: 'bullseye',
        color: 'indigo',
        gradient: 'from-indigo-500 to-purple-600',
        featured: true
      }
    ],
    
    // Specialized Themes (8)
    specialized: [
      {
        name: 'AI Evolution',
        slug: 'ai-evolution',
        description: 'Practical AI insights beyond the hype',
        icon: 'brain',
        color: 'violet',
        gradient: 'from-violet-500 to-purple-600',
        featured: true
      },
      {
        name: 'Developer Stack & Tools',
        slug: 'developer-stack-tools',
        description: 'Tools, frameworks, and technologies that make developers productive',
        icon: 'tools',
        color: 'cyan',
        gradient: 'from-cyan-500 to-blue-600',
        featured: true
      },
      {
        name: 'Research Bites',
        slug: 'research-bites',
        description: 'Digestible insights from tech research and data analysis',
        icon: 'chart-line',
        color: 'teal',
        gradient: 'from-teal-500 to-cyan-600',
        featured: false
      },
      {
        name: 'System Thinking',
        slug: 'system-thinking',
        description: 'Understanding complex systems and their interactions',
        icon: 'sitemap',
        color: 'slate',
        gradient: 'from-slate-500 to-gray-600',
        featured: false
      },
      {
        name: 'The Interface',
        slug: 'the-interface',
        description: 'UI/UX design, human-computer interaction, and digital experiences',
        icon: 'desktop',
        color: 'pink',
        gradient: 'from-pink-500 to-rose-600',
        featured: false
      },
      {
        name: 'Tech Culture',
        slug: 'tech-culture',
        description: 'Team dynamics, remote work, and industry culture insights',
        icon: 'users',
        color: 'emerald',
        gradient: 'from-emerald-500 to-green-600',
        featured: true
      },
      {
        name: 'Global Perspective',
        slug: 'global-perspective',
        description: 'Innovation stories from Africa, Asia, and the Global South',
        icon: 'globe',
        color: 'amber',
        gradient: 'from-amber-500 to-yellow-600',
        featured: true
      },
      {
        name: 'Community Innovation',
        slug: 'community-innovation',
        description: 'How communities drive breakthrough innovation and collaboration',
        icon: 'users-group',
        color: 'lime',
        gradient: 'from-lime-500 to-green-600',
        featured: false
      }
    ],
    
    // Extended Themes (7)
    extended: [
      {
        name: 'Career Stacks',
        slug: 'career-stacks',
        description: 'Career development, skill building, and professional growth in tech',
        icon: 'briefcase',
        color: 'stone',
        gradient: 'from-stone-500 to-gray-600',
        featured: false
      },
      {
        name: 'Future Stacks',
        slug: 'future-stacks',
        description: 'Emerging technologies, future predictions, and next-generation tools',
        icon: 'zap',
        color: 'sky',
        gradient: 'from-sky-500 to-blue-600',
        featured: false
      },
      {
        name: 'Business Models & Monetization',
        slug: 'business-models-monetization',
        description: 'How tech companies make money and sustainable business strategies',
        icon: 'dollar-sign',
        color: 'green',
        gradient: 'from-green-600 to-emerald-700',
        featured: false
      },
      {
        name: 'Creator Economy',
        slug: 'creator-economy',
        description: 'Content creation, personal branding, and the creator business model',
        icon: 'paint-brush',
        color: 'rose',
        gradient: 'from-rose-500 to-pink-600',
        featured: false
      },
      {
        name: 'Consumer Behavior & Attention',
        slug: 'consumer-behavior-attention',
        description: 'Understanding user psychology, attention economy, and behavioral patterns',
        icon: 'eye',
        color: 'orange',
        gradient: 'from-orange-600 to-red-600',
        featured: false
      },
      {
        name: 'Ecosystem Shifts & Market Maps',
        slug: 'ecosystem-shifts-market-maps',
        description: 'Industry transformations, market analysis, and ecosystem changes',
        icon: 'map',
        color: 'blue',
        gradient: 'from-blue-600 to-indigo-600',
        featured: false
      },
      {
        name: 'People & Systems',
        slug: 'people-systems',
        description: 'Human factors in technology, organizational design, and people operations',
        icon: 'network-wired',
        color: 'purple',
        gradient: 'from-purple-600 to-violet-600',
        featured: false
      }
    ]
  },

  // Blog settings
  blog: {
    postsPerPage: 12,
    featuredPostsCount: 3,
    relatedPostsCount: 4,
    excerptLength: 160,
    readingTimeWPM: 200
  },
  
  // SEO and assets
  defaultImage: '/og-image.jpg',
  favicon: '/favicon.svg',
  logo: '/logo.svg',
  
  // Analytics and tracking
  analytics: {
    cloudflareAnalytics: true,
    googleAnalytics: process.env.GOOGLE_ANALYTICS_ID || '',
    plausible: process.env.PLAUSIBLE_DOMAIN || '',
  },

  // Custom comment system (removed giscus)
  comments: {
    provider: 'custom' as const,
    enabled: true,
    moderationEnabled: true,
    requireAuth: false,
    allowAnonymous: true,
    maxNestingLevel: 3,
    features: {
      reactions: true,
      threading: true,
      editing: true,
      deletion: true,
      reporting: true,
      mentions: true,
      notifications: true
    }
  },

  // Features and functionality
  features: {
    search: true,
    darkMode: true,
    newsletter: true,
    comments: true,
    audio: true,
    rss: true,
    sitemap: true,
    progressBar: true,
    tableOfContents: true,
    relatedPosts: true,
    socialShare: true,
    viewTransitions: true,
    podcast: true,
    research: true,
    community: true
  }
} as const;

// Enhanced navigation structure
export const NAV_LINKS = [
  { label: "ARTICLES", href: "/blog", description: "Latest insights and analysis" },
  { label: "CATEGORIES", href: "/blog/categories", description: "Browse by topic" },
  { label: "AUDIO", href: "/audio", description: "Listen on the go" },
  { label: "NEWSLETTERS", href: "/newsletters", description: "12 specialized newsletters" },
  { label: "COMMUNITY", href: "/community", description: "Join the conversation" },
  { label: "CONTACT", href: "/contact", description: "Get in touch" }
] as const;

// Helper function to get all categories as flat array
export const getAllCategories = () => {
  return [
    ...SITE.categories.core,
    ...SITE.categories.specialized,
    ...SITE.categories.extended
  ];
};

// Helper function to get featured categories
export const getFeaturedCategories = () => {
  return getAllCategories().filter(cat => cat.featured);
};

// Helper function to get all newsletters as flat array
export const getAllNewsletters = () => {
  return [
    ...SITE.newsletters.weekly,
    ...SITE.newsletters.monthly,
    ...SITE.newsletters.limitedSeries
  ];
};

// Helper function to get active newsletters
export const getActiveNewsletters = () => {
  return getAllNewsletters().filter(newsletter => newsletter.active);
};

// Enhanced footer structure
export const FOOTER_LINKS = {
  content: [
    { label: "Blog", href: "/blog", description: "All articles" },
    { label: "Featured Articles", href: "/featured", description: "Editor's picks" },
    { label: "Archive", href: "/archive", description: "Browse all posts" },
    { label: "Audio", href: "/audio", description: "Listen to articles" }
  ],
  newsletters: [
    { label: "All Newsletters", href: "/newsletters", description: "12 specialized newsletters" },
    { label: "TinkByte Weekly", href: "/newsletters/tinkbyte-weekly", description: "Core weekly digest" },
    { label: "Build Sheet", href: "/newsletters/build-sheet", description: "Development insights" },
    { label: "StackDown", href: "/newsletters/stackdown", description: "Tech stack analysis" }
  ],
  company: [
    { label: "About", href: "/about", description: "Our story" },
    { label: "Contact", href: "/contact", description: "Get in touch" },
    { label: "Community", href: "/community", description: "Join us" },
    { label: "Research", href: "/research", description: "Our research" }
  ],
  legal: [
    { label: "Privacy Policy", href: "/legal/privacy-policy", description: "How we handle data" },
    { label: "Terms of Service", href: "/legal/terms-of-service", description: "Usage terms" },
    { label: "Cookie Policy", href: "/legal/cookie-policy", description: "Cookie usage" },
    { label: "Sitemap", href: "/sitemap.xml", description: "Site structure" }
  ],
  resources: [
    { label: "RSS Feed", href: "/rss.xml", description: "Subscribe to updates" },
    { label: "Search", href: "/search", description: "Find content" },
    { label: "Tags", href: "/tags", description: "Browse by tags" },
    { label: "Authors", href: "/authors", description: "Meet our writers" }
  ]
} as const;

// Enhanced SEO configuration
export const SEO = {
  defaultTitle: SITE.title,
  defaultDescription: SITE.description,
  defaultImage: SITE.url + SITE.defaultImage,
  siteName: SITE.name,
  twitterCard: 'summary_large_image',
  twitterSite: SITE.social.twitter,
  twitterCreator: SITE.social.twitter,
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    images: [
      {
        url: SITE.url + SITE.defaultImage,
        width: 1200,
        height: 630,
        alt: SITE.title,
        type: 'image/jpeg'
      }
    ]
  },
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: SITE.url + SITE.logo
      },
      sameAs: [
        `https://twitter.com/${SITE.social.twitter.replace('@', '')}`,
        `https://linkedin.com/${SITE.social.linkedin}`,
        `https://github.com/${SITE.social.github}`,
        `https://youtube.com/${SITE.social.youtube.replace('@', '')}`,
        `https://instagram.com/${SITE.social.instagram.replace('@', '')}`,
        `https://tiktok.com/${SITE.social.tiktok.replace('@', '')}`,
        `https://substack.com/${SITE.social.substack}`,
        `https://medium.com/${SITE.social.medium}`,
        `https://dev.to/${SITE.social.devto}`,
        `https://hashnode.com/${SITE.social.hashnode}`
      ]
    }
  }
} as const;

// Category mapping for backward compatibility
export const CATEGORY_MAPPING = {
  // Legacy to new mappings
  'startup-insights': 'startup-insight',
  'developer-tools': 'developer-stack-tools',
  'research-backed': 'research-bites',
  'build-loop': 'fail-iterate-ship',
  'business-models': 'business-models-monetization',
  'consumer-behavior': 'consumer-behavior-attention',
  'market-maps': 'ecosystem-shifts-market-maps',
  'future-tech': 'future-stacks'
} as const;

// Newsletter mapping for backward compatibility
export const NEWSLETTER_MAPPING = {
  'future-tech': 'start-here-future-tech'
} as const;

// Type definitions
export interface Category {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  featured: boolean;
}

export interface Newsletter {
  name: string;
  slug: string;
  description: string;
  frequency: string;
  audience: string;
  contentMix: string;
  active: boolean;
  totalIssues?: number;
  currentIssue?: number;
}

export interface Article {
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  slug: string;
  image?: string;
  imageAlt?: string;
  tags: string[];
  category: string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
    bio?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
      website?: string;
    };
  };
  featured?: boolean;
  trending?: boolean;
  hero?: boolean;
  audioUrl?: string;
  audioDuration?: string;
  publishedAt: Date;
  updatedAt?: Date;
  seo?: {
    title?: string;
    description?: string;
    canonical?: string;
    noindex?: boolean;
  };
}