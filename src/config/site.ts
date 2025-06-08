// src/config/site.ts - FIXED Environment Variable Access
export const SITE = {
  name: 'TinkByte',
  title: 'TinkByte | Digital Tech Innovation Weekly',
  description: 'TinkByte delivers practical tech insights and innovation analysis without the hype. Weekly articles on AI, product development, and emerging technologies.',
  url: 'https://tinkbyte.com',
  author: 'TinkByte Team',
  locale: 'en-US',
  
  // Your Brand Colors
  brand: {
    primary: '#243788',      // Your primary blue
    secondary: '#b4bce1',    // Your light accent
    dark: '#1a2b5c',        // Darker variant for hover states
    light: '#e8ebf4',       // Lighter variant for backgrounds
  },
  
  social: {
    twitter: '@tinkbytehq',
    youtube: '@tinkbytehq',
    linkedin: 'company/tinkbytehq',
    instagram: '@tinkbytehq',
    tiktok: '@tinkbytehq',
    github: 'tinkbyte',
    email: 'feedback@tinkbyte.com'
  },

  newsletter: {
    name: 'TinkStacks Weekly',
    description: 'Weekly tech insights delivered to your inbox',
    frequency: 'Weekly on Tuesdays',
    tagline: 'No hype. Just insights.'
  },

  blog: {
    postsPerPage: 12,
    featuredPostsCount: 3
  },
  
  defaultImage: '/og-image.jpg',
  favicon: '/favicon.svg',
  
  analytics: {
    cloudflareAnalytics: true // Free with Cloudflare Pages
  },

  // Comment system configuration - FIXED: Removed import.meta.env references
  comments: {
    provider: 'giscus' as const,
    giscusConfig: {
      repo: 'Eizijesu/tinkbyte', // Set your default values or make this configurable elsewhere
      repoId: 'R_kgDOO14dQA',
      category: 'General',
      categoryId: 'DIC_kwDOO14dQM4CrB7H',
      mapping: 'pathname' as const,
      theme: 'preferred_color_scheme' as const,
      reactionsEnabled: true,
      emitMetadata: false,
      inputPosition: 'top' as const,
      lang: 'en',
      loading: 'lazy' as const
    }
  }
} as const;

// Navigation that matches your header
export const NAV_LINKS = [
  { label: "ARTICLES", href: "/blog" },
  { label: "CATEGORIES", href: "/blog/categories" },
  { label: "AUDIO", href: "/audio" },
  { label: "COMMUNITY", href: "/community" },
  { label: "CONTACT", href: "/contact" }
] as const;

// Categories configuration
export const CATEGORIES = {
  'ai-evolution': {
    name: 'AI Evolution',
    description: 'Machine learning, neural networks, and practical AI applications',
    color: 'purple' as const,
    icon: 'brain'
  },
  'product-strategy': {
    name: 'Product Strategy', 
    description: 'Product management insights, user experience design, and growth strategies',
    color: 'green' as const,
    icon: 'lightbulb'
  },
  'tech-culture': {
    name: 'Tech Culture',
    description: 'Team dynamics, remote work, and industry culture', 
    color: 'blue' as const,
    icon: 'users'
  },
  'startup-lessons': {
    name: 'Startup Lessons',
    description: 'Entrepreneurship, scaling, and lessons from the trenches',
    color: 'orange' as const, 
    icon: 'rocket'
  },
  'developer-tools': {
    name: 'Developer Tools',
    description: 'Framework reviews, productivity tools, and development resources',
    color: 'cyan' as const,
    icon: 'tools'
  },
  'industry-analysis': {
    name: 'Industry Analysis',
    description: 'Market trends, company analysis, and business of technology',
    color: 'red' as const,
    icon: 'news'
  },
  'emerging-tech': {
    name: 'Emerging Tech',
    description: 'Future technologies, research breakthroughs, and innovation',
    color: 'indigo' as const,
    icon: 'rocket'
  },
  'future-tech': {
    name: 'Future Tech',
    description: 'Quantum computing, advanced AI, and next-generation technologies',
    color: 'violet' as const,
    icon: 'sparkles'
  }
} as const;

export const FOOTER_LINKS = {
  content: [
    { label: "Blog", href: "/blog" },
    { label: "Featured Articles", href: "/featured" },
    { label: "Archive", href: "/archive" },
    { label: "Podcast", href: "/podcast" }
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Newsletter", href: "/newsletter" },
    { label: "Community", href: "/community" }
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Sitemap", href: "/sitemap.xml" },
    { label: "RSS Feed", href: "/rss.xml" }
  ],
  social: [
    { label: "Twitter", href: "https://twitter.com/tinkbytehq" },
    { label: "YouTube", href: "https://youtube.com/@tinkbytehq" },
    { label: "LinkedIn", href: "https://linkedin.com/company/tinkbytehq" },
    { label: "Instagram", href: "https://instagram.com/tinkbytehq" },
    { label: "TikTok", href: "https://tiktok.com/@tinkbytehq" },
    { label: "GitHub", href: "https://github.com/tinkbyte" }
  ]
} as const;

// Article type definitions
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
  seo?: {
    title?: string;
    description?: string;
    canonical?: string;
  };
}

// Author type definitions
export interface Author {
  name: string;
  bio: string;
  avatar: string;
  role: string;
  company?: string;
  email?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  featured?: boolean;
}

// Category type definitions
export interface Category {
  name: string;
  description: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan' | 'indigo' | 'violet' | 'pink' | 'yellow';
  icon: string;
  featured?: boolean;
}

// Podcast episode type definitions
export interface PodcastEpisode {
  title: string;
  description: string;
  pubDate: string;
  duration: string;
  audioUrl: string;
  image?: string;
  guests?: string[];
  transcript?: string;
  season?: number;
  episode: number;
  featured?: boolean;
}

// SEO configuration
export const SEO = {
  defaultTitle: SITE.title,
  defaultDescription: SITE.description,
  defaultImage: SITE.url + SITE.defaultImage,
  siteName: SITE.name,
  twitterCard: 'summary_large_image',
  twitterSite: SITE.social.twitter,
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
        alt: SITE.title
      }
    ]
  }
} as const;