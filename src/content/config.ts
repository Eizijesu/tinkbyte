// src/content/config.ts - Complete backward compatible version
import { defineCollection, z } from "astro:content";

// Blog collection schema - Backward compatible with optional authorInfo
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(100),
    excerpt: z.string().max(160),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    
    // Keep old author structure as primary (for existing posts)
    author: z.string().default("TinkByte Team"),
    authorBio: z.string().optional(),
    authorAvatar: z.string().optional(),
    authorRole: z.string().optional(),
    authorSocial: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      website: z.string().optional(),
    }).optional(),
    
    // New authorInfo structure (optional for backward compatibility)
    authorInfo: z.object({
      name: z.string(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
      role: z.string().optional(),
      company: z.string().optional(),
      email: z.string().optional(),
      social: z.object({
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
        github: z.string().optional(),
        website: z.string().optional(),
      }).optional(),
    }).optional(),
    
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string(),
    storyType: z.string().optional(),
    featured: z.boolean().default(false),
    trending: z.boolean().default(false),
    draft: z.boolean().default(false),
    readTime: z.string().optional(),
    audioUrl: z.string().optional(),
    audioDuration: z.string().optional(),
    audioTranscript: z.string().optional(),
    
    // Newsletter integration fields
    newsletterWorthy: z.boolean().default(false),
    newsletterSummary: z.string().optional(),
    
    // Reading experience fields
    readingProgress: z.boolean().default(true),
    tableOfContents: z.boolean().default(true),
    
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
      noindex: z.boolean().default(false),
      schema: z.enum(['Article', 'BlogPosting', 'TechArticle']).default('Article'),
    }).optional(),
  }),
});

// Authors collection schema
const authorsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string(),
    role: z.string(),
    company: z.string().optional(),
    email: z.string().optional(),
    social: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      website: z.string().optional(),
    }).optional(),
    featured: z.boolean().default(false),
  }),
});

// Categories collection schema
const categoriesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    color: z.string(),
    featured: z.boolean().default(false),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    }).optional(),
  }),
});

// Podcast collection schema
const podcastCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    duration: z.string(),
    audioUrl: z.string(),
    image: z.string().optional(),
    guests: z.array(z.string()).default([]),
    transcript: z.string().optional(),
    season: z.number().optional(),
    episode: z.number(),
    featured: z.boolean().default(false),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
    }).optional(),
  }),
});

// Pages collection schema
const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    layout: z.string().optional(),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
      noindex: z.boolean().optional(),
    }).optional(),
  }),
});

// Legal pages collection schema
const legalCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    pageType: z.enum(['legal', 'policy', 'terms', 'general']).default('general'),
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

// Newsletter collection schema
const newsletterCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    pubDate: z.date(),
    issue: z.number(),
    featured: z.boolean().default(false),
    
    // Newsletter-specific fields
    status: z.enum(['draft', 'scheduled', 'sent']).default('draft'),
    subscriberCount: z.number().optional(),
    openRate: z.number().optional(),
    clickRate: z.number().optional(),
    
    // Structured content sections
    sections: z.array(z.object({
      title: z.string(),
      content: z.string(),
      type: z.enum(['article', 'link', 'announcement', 'community']),
    })).optional(),
    
    // Featured articles from blog
    featuredArticles: z.array(z.string()).optional(),
    
    // CTA section
    cta: z.object({
      title: z.string(),
      description: z.string(),
      buttonText: z.string(),
      buttonUrl: z.string(),
    }).optional(),
  }),
});

// Settings collection for dynamic content
const settingsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    // Site configuration
    site: z.object({
      name: z.string().default('TinkByte'),
      description: z.string().optional(),
      url: z.string().url().optional(),
      logo: z.string().optional(),
      favicon: z.string().optional(),
      
      // Giscus comments configuration
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
      }).optional(),
    }).optional(),
    
    // Categories configuration
    categories: z.object({
      defaultColor: z.string().default('#6366f1'),
      categoryMappings: z.array(z.object({
        name: z.string(),
        slug: z.string(),
        color: z.string(),
        description: z.string().optional(),
      })).optional(),
    }).optional(),
    
    // UI Text configuration
    uiText: z.object({
      audioAvailableLabel: z.string().default('🎧 Audio Available'),
      audioTitle: z.string().default('Listen to this article'),
      audioSubtitle: z.string().default('Perfect for multitasking or learning on the go'),
      noAudioText: z.string().default('Audio version not available for this article'),
      byAuthorPrefix: z.string().default('By'),
      aboutAuthorTitle: z.string().default('About the Author'),
      shareLabel: z.string().default('Share'),
      shareArticleTitle: z.string().default('Share this article'),
      continueReadingTitle: z.string().default('Continue Reading'),
      continueReadingSubtitle: z.string().default('Explore more insights'),
      previousArticleLabel: z.string().default('Previous'),
      nextArticleLabel: z.string().default('Next'),
      reachedBeginningText: z.string().default('You\'ve reached the beginning'),
      readAllText: z.string().default('You\'ve read it all!'),
      browseAllArticlesText: z.string().default('Browse all articles'),
      tocTitle: z.string().default('Table of Contents'),
      topicsTitle: z.string().default('Topics'),
      readingProgressTitle: z.string().default('Reading Progress'),
      imageCreditText: z.string().default('Image credit'),
      readingTimePrefix: z.string().default('Reading time:'),
      defaultCategoryLabel: z.string().default('Article'),
      discussionTitle: z.string().default('Join the Discussion'),
      discussionSubtitle: z.string().default('Share your thoughts and connect with the community'),
      relatedTitle: z.string().default('Related Articles'),
      relatedSubtitle: z.string().default('Continue exploring'),
    }).optional(),
    
    // Community settings
    community: z.object({
      stats: z.array(z.object({
        number: z.string(),
        label: z.string(),
        icon: z.string(),
      })).optional(),
      platforms: z.array(z.object({
        name: z.string(),
        description: z.string(),
        icon: z.string(),
        link: z.string(),
        members: z.string().optional(),
        activity: z.string().optional(),
        color: z.string().optional(),
      })).optional(),
    }).optional(),
    
    // Research settings
    research: z.object({
      stats: z.array(z.object({
        number: z.string(),
        label: z.string(),
        icon: z.string(),
      })).optional(),
      reports: z.array(z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        type: z.enum(['industry-analysis', 'technical-deep-dive', 'market-research', 'user-study', 'trend-report', 'case-study']),
        pages: z.number().optional(),
        downloads: z.string().optional(),
        downloadUrl: z.string().optional(),
        coverImage: z.string().optional(),
        featured: z.boolean().default(false),
        tags: z.array(z.string()).default([]),
      })).optional(),
    }).optional(),
    
    // Newsletter settings
    newsletter: z.object({
      title: z.string().default('TinkStacks Weekly'),
      subtitle: z.string().default('Weekly insights on AI, tech, and innovation'),
      frequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'irregular']).default('weekly'),
      subscriberCount: z.string().default('1,200+'),
      signupFormId: z.string().optional(),
      confirmationMessage: z.string().default('Thank you for subscribing! Check your email to confirm.'),
    }).optional(),
    
    // Social media configuration
    social: z.object({
      platforms: z.array(z.object({
        name: z.enum(['twitter', 'linkedin', 'github', 'youtube', 'instagram', 'tiktok', 'discord']),
        url: z.string(),
        username: z.string().optional(),
        showInFooter: z.boolean().default(true),
        enableSharing: z.boolean().default(true),
      })).optional(),
      defaultShareText: z.string().default('Check out this article from TinkByte'),
    }).optional(),
    
    // Analytics and tracking
    analytics: z.object({
      googleAnalyticsId: z.string().optional(),
      googleTagManagerId: z.string().optional(),
      enableCookieConsent: z.boolean().default(false),
      cookieConsentMessage: z.string().default('We use cookies to enhance your experience and analyze our traffic.'),
    }).optional(),
    
    // Performance settings
    performance: z.object({
      enableImageOptimization: z.boolean().default(true),
      enableLazyLoading: z.boolean().default(true),
      enableServiceWorker: z.boolean().default(false),
      cacheMaxAge: z.number().default(24),
    }).optional(),
  }),
});

// Export all collections
export const collections = {
  blog: blogCollection,
  authors: authorsCollection,
  categories: categoriesCollection,
  podcast: podcastCollection,
  newsletter: newsletterCollection,
  pages: pagesCollection,
  legal: legalCollection,
  settings: settingsCollection,
};