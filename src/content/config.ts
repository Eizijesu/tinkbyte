// src/content/config.ts - Enhanced social media support
import { defineCollection, z } from 'astro:content';

// Enhanced social media schema for reuse
const socialMediaSchema = z.object({
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  discord: z.string().optional(),
  substack: z.string().optional(),
  medium: z.string().optional(),
  devto: z.string().optional(),
  hashnode: z.string().optional(),
  reddit: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  threads: z.string().optional(),
  mastodon: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
});

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Basic post information
    title: z.string().max(100),
    subtitle: z.string().optional(),
    excerpt: z.string().max(300),
    description: z.string().optional(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),

    // Author information with enhanced social support
    authorInfo: z.object({
      name: z.string(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
      role: z.string().optional(),
      social: socialMediaSchema.optional(),
    }).optional(),

    // Enhanced image handling
    heroImage: z.object({
      imageType: z.enum(['upload', 'url']),
      uploadedImage: z.string().optional(),
      externalUrl: z.string().optional(),
      alt: z.string(),
      caption: z.string().optional(),
    }).optional(),

    // Legacy image fields for backward compatibility
    image: z.string().optional(),
    imageAlt: z.string().optional(),

    // Content categorization
    tags: z.array(z.string()).default([]),
    category: z.enum([
      'product-strategy',
      'ai-evolution',
      'developer-tools',
      'tech-culture',
      'startup-insights',
      'build-thinking',
      'community-innovation',
      'learning-by-doing',
      'no-fluff-coverage',
      'research-backed',
      'global-perspective',
      'privacy-security',
      'mobile-development',
      'cloud-technologies',
      'data-science',
      'other'
    ]),

    storyType: z.enum([
      'feature',
      'technical-analysis',
      'quick-read',
      'data-story',
      'build-guide',
      'failure-story',
      'global-spotlight'
    ]).optional(),

    // Publishing options
    featured: z.boolean().default(false),
    trending: z.boolean().default(false),
    draft: z.boolean().default(false),

    // Reading experience
    readTime: z.string().optional(),

    // Audio content
    audioUrl: z.string().optional(),
    audioDuration: z.string().optional(),
    audioTranscript: z.string().optional(),

    // Editorial workflow fields
    editorial: z.object({
      status: z.enum([
        'draft',
        'review',
        'approved',
        'published',
        'revision'
      ]).optional(),
      assignedEditor: z.string().optional(),
      editorNotes: z.string().optional(),
    }).optional(),

    // Enhanced SEO settings
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
      noindex: z.boolean().default(false),
    }).optional(),
  }),
});

// All Topics page collection
const allTopicsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().default('All Topics'),
    description: z.string().default('Explore all topic categories'),
    hero: z.object({
      badgeText: z.string().default('TINKBYTE CATEGORIES'),
      title: z.string().default('Explore'),
      titleAccent: z.string().default('TinkByte Topics'),
      subtitle: z.string().default('Future focused categories covering every aspect of building products that matter'),
    }),
    topics: z.array(z.object({
      name: z.string(),
      href: z.string(),
      description: z.string(),
      audience: z.string(),
    })),
    stats: z.object({
      topicCount: z.number().default(14),
      articleCount: z.string().default('100+'),
      storiesLabel: z.string().default('Real'),
    }),
    cta: z.object({
      title: z.string().default('Stay Updated'),
      description: z.string().default('Get practical insights delivered weekly. No fluff, just actionable content.'),
      primaryButtonText: z.string().default('Subscribe Newsletter'),
      primaryButtonLink: z.string().default('/newsletter'),
      secondaryButtonText: z.string().default('Join Community'),
      secondaryButtonLink: z.string().default('/community'),
    }),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
      noindex: z.boolean().default(false),
    }).optional(),
  }),
});

// Authors collection with enhanced social support
const authorsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    role: z.string().optional(),
    company: z.string().optional(),
    email: z.string().optional(),
    social: socialMediaSchema.optional(),
    featured: z.boolean().default(false),
  }),
});

// Categories collection
const categoriesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    icon: z.enum([
      'hammer',
      'users',
      'book',
      'bullseye',
      'chart-line',
      'globe',
      'brain',
      'lightbulb',
      'rocket',
      'tools',
      'code',
      'cog',
      'star',
      'fire',
      'shield-alt',
      'database',
      'mobile-alt',
      'cloud',
      'lock',
      'microchip'
    ]),
    color: z.enum([
      'purple',
      'green',
      'blue',
      'cyan',
      'orange',
      'red',
      'pink',
      'yellow',
      'gray'
    ]),
    featured: z.boolean().default(false),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    }).optional(),
  }),
});

// Podcast collection with enhanced guest social support
const podcastCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    duration: z.string(),
    audioUrl: z.string(),
    image: z.string().optional(),
    downloadable: z.boolean().default(false),
    guests: z.array(z.object({
      name: z.string(),
      role: z.string().optional(),
      company: z.string().optional(),
      bio: z.string().optional(),
      photo: z.string().optional(),
      social: socialMediaSchema.optional(),
    })).default([]),
    status: z.enum(['draft', 'recording', 'editing', 'ready', 'published']).default('draft'),
    transcript: z.string().optional(),
    season: z.number().optional(),
    episode: z.number(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
    }).optional(),
  }),
});

// Newsletter collection
const newsletterCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    issueNumber: z.number(),
    excerpt: z.string(),
    publishDate: z.date(),
    newsletterType: z.enum([
      'tinkbyte-weekly',
      'build-sheet', 
      'stackdown',
      'signal-drop',
      'system-signal',
      'the-real-build',
      'the-loop',
      'data-slice',
      'the-mirror',
      'community-code',
      'future-tech'
    ]),
    subscriberOnly: z.boolean().default(true),
    previewContent: z.string().optional(),
    readingTime: z.number().optional(),
    status: z.enum(['draft', 'review', 'scheduled', 'published', 'archived']),
    featured: z.boolean().default(false),
    trackStats: z.boolean().default(false),
    stats: z.object({
      subscribers: z.number(),
      openRate: z.number(),
      clickRate: z.number(),
    }).optional(),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    highlights: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      link: z.string().optional(),
    })).optional(),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    }).optional(),
  }),
});

// Enhanced Pages collection with comprehensive social support
const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    layout: z.enum(['default', 'full-width', 'minimal']).optional(),
    
    // About page specific fields
    mission: z.string().optional(),
    vision: z.string().optional(),
    values: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
    })).optional(),
    team: z.array(z.object({
      name: z.string(),
      role: z.string(),
      bio: z.string().optional(),
      image: z.string().optional(),
      social: socialMediaSchema.optional(),
    })).optional(),
    
    // Community page specific fields
    community: z.object({
      stats: z.array(z.object({
        number: z.string(),
        label: z.string(),
        icon: z.string().optional(),
      })),
      platforms: z.array(z.object({
        name: z.string(),
        description: z.string(),
        icon: z.string(),
        link: z.string(),
        members: z.string(),
        activity: z.string(),
        color: z.string(),
        featured: z.boolean().default(false),
      })),
      hero: z.object({
        badgeText: z.string().optional(),
        title: z.string().optional(),
        titleAccent: z.string().optional(),
        subtitle: z.string().optional(),
      }).optional(),
    }).optional(),
    
    // Research page specific fields
    research: z.object({
      stats: z.array(z.object({
        number: z.string(),
        label: z.string(),
        icon: z.string().optional(),
      })),
      reports: z.array(z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        type: z.string(),
        pages: z.number(),
        downloads: z.string(),
        featured: z.boolean(),
        downloadUrl: z.string().optional(),
        slug: z.string().optional(),
      })),
      hero: z.object({
        badgeText: z.string().optional(),
        title: z.string().optional(),
        titleAccent: z.string().optional(),
        subtitle: z.string().optional(),
      }).optional(),
    }).optional(),
    
    // SEO settings
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
      noindex: z.boolean().optional(),
    }).optional(),
  }),
});

// Contact page collection
const contactCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    
    // Hero section
    hero: z.object({
      title: z.string(),
      titleAccent: z.string(),
      subtitle: z.string(),
      responseTime: z.string().optional(),
      badgeText: z.string().optional(),
    }).optional(),
    
    // Contact methods
    contactMethods: z.array(z.object({
      title: z.string(),
      description: z.string(),
      email: z.string(),
      icon: z.string(),
      color: z.string(),
      featured: z.boolean().default(false),
    })),
    
    // Social links
    socialLinks: z.array(z.object({
      name: z.string(),
      url: z.string(),
      icon: z.string(),
      color: z.string(),
      showInContact: z.boolean().default(true),
    })),
    
    // FAQ section
    faq: z.object({
      enabled: z.boolean().default(true),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      items: z.array(z.object({
        question: z.string(),
        answer: z.string(),
        category: z.string().optional(),
        featured: z.boolean().default(false),
      })),
    }).optional(),
    
    // CTA section
    cta: z.object({
      title: z.string(),
      titleAccent: z.string(),
      subtitle: z.string(),
      primaryButton: z.object({
        text: z.string(),
        link: z.string(),
      }),
      secondaryButton: z.object({
        text: z.string(),
        link: z.string(),
      }),
    }).optional(),
    
    // SEO settings
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
      noindex: z.boolean().optional(),
    }).optional(),
  }),
});

// Legal collection
const legalCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    pageType: z.enum(['legal', 'policy', 'terms', 'general']).default('legal'),
    effectiveDate: z.string().optional(),
    contact: z.object({
      email: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
    }).optional(),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      noindex: z.boolean().optional(),
    }).optional(),
  }),
});

// Enhanced Settings collection with comprehensive social media support
const settingsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().default('Site Settings'),
    description: z.string().optional(),
    
    // Site configuration
    site: z.object({
      name: z.string().default('TinkByte'),
      description: z.string().default('Building meaningful, data-driven products that solve real problems'),
      url: z.string().url().default('https://tinkbyte.com'),
      logo: z.string().optional(),
      favicon: z.string().optional(),
      language: z.string().default('en'),
      timezone: z.string().default('UTC'),
    }).optional(),
    
    // Comprehensive social media settings
    social: socialMediaSchema.optional(),
    
    // Newsletter settings
    newsletter: z.object({
      provider: z.enum(['mailchimp', 'convertkit', 'substack', 'beehiiv', 'custom']).default('custom'),
      signupUrl: z.string().optional(),
      welcomeMessage: z.string().optional(),
      frequency: z.string().default('weekly'),
      subscriberCount: z.string().optional(),
    }).optional(),
    
    // Analytics and tracking
    analytics: z.object({
      googleAnalytics: z.string().optional(),
      plausible: z.object({
        domain: z.string().optional(),
        apiKey: z.string().optional(),
      }).optional(),
      umami: z.object({
        websiteId: z.string().optional(),
        scriptUrl: z.string().optional(),
      }).optional(),
    }).optional(),
    
    // Comments system
    comments: z.object({
      enabled: z.boolean().default(true),
      provider: z.enum(['giscus', 'disqus', 'utterances', 'custom']).default('giscus'),
      giscus: z.object({
        repo: z.string(),
        repoId: z.string(),
        category: z.string(),
        categoryId: z.string(),
        mapping: z.enum(['pathname', 'url', 'title', 'og:title']).default('pathname'),
        reactionsEnabled: z.boolean().default(true),
        emitMetadata: z.boolean().default(false),
        inputPosition: z.enum(['top', 'bottom']).default('bottom'),
        lang: z.string().default('en'),
        loading: z.enum(['lazy', 'eager']).default('lazy'),
        theme: z.string().default('preferred_color_scheme'),
      }).optional(),
    }).optional(),
    
    // Feature flags
    features: z.object({
      darkMode: z.boolean().default(true),
      search: z.boolean().default(true),
      rss: z.boolean().default(true),
      sitemap: z.boolean().default(true),
      podcast: z.boolean().default(true),
      newsletter: z.boolean().default(true),
      community: z.boolean().default(true),
      research: z.boolean().default(true),
      socialSharing: z.boolean().default(true),
      readingTime: z.boolean().default(true),
      relatedPosts: z.boolean().default(true),
    }).optional(),
    
    // Contact information
    contact: z.object({
      email: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      businessHours: z.string().optional(),
    }).optional(),
  }),
});

export const collections = {
  blog: blogCollection,
  authors: authorsCollection,
  categories: categoriesCollection,
  podcast: podcastCollection,
  newsletter: newsletterCollection,
  pages: pagesCollection,
  legal: legalCollection,
  settings: settingsCollection,
  allTopics: allTopicsCollection,
  contact: contactCollection,
};