---
title: "TinkByte Site Settings"
description: "Main site configuration and settings"
site:
  name: "TinkByte"
  description: "building meaningful, data-driven products that solve real problems"
  url: "https://tinkbyte.com"
  logo: "/images/logo.png"
  favicon: "/favicon.ico"
  language: "en"
  timezone: "UTC"
  giscus:
    repo: "your-username/your-repo"
    repoId: "your-repo-id"
    category: "General"
    categoryId: "your-category-id"
    mapping: "pathname"
    reactionsEnabled: true
    emitMetadata: false
    inputPosition: "top"
    lang: "en"
    loading: "lazy"

# Comprehensive social media configuration
social:
  # Main platforms
  twitter: "https://twitter.com/tinkbytehq"
  linkedin: "https://linkedin.com/company/tinkbytehq"
  github: "https://github.com/tinkbyte"
  discord: "https://discord.gg/tinkbyte"
  instagram: "https://instagram.com/tinkbytehq"
  
  # Content platforms
  youtube: "https://youtube.com/@tinkbytehq"
  substack: "https://tinkbyte.substack.com"
  medium: "https://medium.com/@tinkbyte"
  devto: "https://dev.to/tinkbyte"
  hashnode: "https://tinkbyte.hashnode.dev"
  
  # Community platforms
  reddit: "https://reddit.com/r/tinkbyte"
  threads: "https://threads.net/@tinkbytehq"
  mastodon: "https://mastodon.social/@tinkbyte"
  
  # Contact
  email: "hello@tinkbyte.com"
  website: "https://tinkbyte.com"
  
  # Platform-specific settings
  platforms:
    - name: "twitter"
      url: "https://twitter.com/tinkbytehq"
      username: "tinkbytehq"
      showInFooter: true
      enableSharing: true
      featured: true
    - name: "linkedin"
      url: "https://linkedin.com/company/tinkbytehq"
      username: "tinkbytehq"
      showInFooter: true
      enableSharing: true
      featured: true
    - name: "github"
      url: "https://github.com/tinkbyte"
      username: "tinkbyte"
      showInFooter: true
      enableSharing: false
      featured: true
    - name: "discord"
      url: "https://discord.gg/tinkbyte"
      username: "tinkbyte"
      showInFooter: true
      enableSharing: false
      featured: true
    - name: "instagram"
      url: "https://instagram.com/tinkbytehq"
      username: "tinkbytehq"
      showInFooter: true
      enableSharing: true
      featured: true
    - name: "youtube"
      url: "https://youtube.com/@tinkbytehq"
      username: "tinkbytehq"
      showInFooter: true
      enableSharing: true
      featured: false
    - name: "substack"
      url: "https://tinkbyte.substack.com"
      username: "tinkbyte"
      showInFooter: true
      enableSharing: true
      featured: true
    - name: "medium"
      url: "https://medium.com/@tinkbyte"
      username: "tinkbyte"
      showInFooter: false
      enableSharing: true
      featured: false
    - name: "devto"
      url: "https://dev.to/tinkbyte"
      username: "tinkbyte"
      showInFooter: false
      enableSharing: true
      featured: false
    - name: "reddit"
      url: "https://reddit.com/r/tinkbyte"
      username: "tinkbyte"
      showInFooter: false
      enableSharing: true
      featured: false
  
  defaultShareText: "check out this insightful article from tinkbyte - building meaningful tech products that solve real problems."

# Newsletter configuration
newsletter:
  title: "TinkStacks Weekly"
  subtitle: "weekly insights on ai, tech, and innovation delivered to your inbox"
  provider: "substack"
  signupUrl: "https://tinkbyte.substack.com/subscribe"
  welcomeMessage: "welcome to tinkbyte! get practical insights delivered weekly."
  frequency: "weekly"
  subscriberCount: "1,500+"
  signupFormId: "newsletter-signup"
  confirmationMessage: "thanks for subscribing! check your email to confirm your subscription."

# Analytics and tracking
analytics:
  googleAnalyticsId: ""
  googleTagManagerId: ""
  enableCookieConsent: false
  cookieConsentMessage: "we use cookies to enhance your browsing experience and analyze our traffic."
  plausible:
    domain: "tinkbyte.com"
    apiKey: ""
  umami:
    websiteId: ""
    scriptUrl: ""

# Comments system
comments:
  enabled: true
  provider: "giscus"
  giscus:
    repo: "your-username/your-repo"
    repoId: "your-repo-id"
    category: "General"
    categoryId: "your-category-id"
    mapping: "pathname"
    reactionsEnabled: true
    emitMetadata: false
    inputPosition: "bottom"
    lang: "en"
    loading: "lazy"
    theme: "preferred_color_scheme"

# Feature flags
features:
  darkMode: true
  search: true
  rss: true
  sitemap: true
  podcast: true
  newsletter: true
  community: true
  research: true
  socialSharing: true
  readingTime: true
  relatedPosts: true

# Performance settings
performance:
  enableImageOptimization: true
  enableLazyLoading: true
  enableServiceWorker: false
  cacheMaxAge: 24

# Contact information
contact:
  email: "hello@tinkbyte.com"
  businessHours: "monday - friday, 9am - 5pm utc"

# Categories (keeping your existing structure)
categories:
  defaultColor: "#6b7280"
  categoryMappings:
    - name: "build-thinking"
      slug: "build-thinking"
      color: "#1A73E8"
      description: "how products actually get made - practical insights from the trenches"
    - name: "community-innovation"
      slug: "community-innovation"
      color: "#10B981"
      description: "how communities drive breakthrough innovation"
    - name: "learning-by-doing"
      slug: "learning-by-doing"
      color: "#EA4335"
      description: "real lessons from failures, mvps, and successful launches"
    - name: "no-fluff-coverage"
      slug: "no-fluff-coverage"
      color: "#FF9800"
      description: "direct insights without the marketing speak"
    - name: "research-backed"
      slug: "research-backed"
      color: "#FBBC04"
      description: "data-driven insights and evidence-based content"
    - name: "global-perspective"
      slug: "global-perspective"
      color: "#9C27B0"
      description: "innovation stories from around the world"
    - name: "ai-evolution"
      slug: "ai-evolution"
      color: "#8B5CF6"
      description: "practical ai insights beyond the hype"
    - name: "product-strategy"
      slug: "product-strategy"
      color: "#F59E0B"
      description: "strategic approaches to product development"
    - name: "developer-tools"
      slug: "developer-tools"
      color: "#06B6D4"
      description: "tools and technologies that make developers more productive"
    - name: "tech-culture"
      slug: "tech-culture"
      color: "#8B5CF6"
      description: "culture, teams, and human aspects of technology"
    - name: "privacy-security"
      slug: "privacy-security"
      color: "#DC2626"
      description: "privacy protection and security best practices"
    - name: "mobile-development"
      slug: "mobile-development"
      color: "#059669"
      description: "mobile app development and mobile-first strategies"
    - name: "cloud-technologies"
      slug: "cloud-technologies"
      color: "#0284C7"
      description: "cloud platforms, serverless, and distributed systems"
    - name: "data-science"
      slug: "data-science"
      color: "#7C3AED"
      description: "data analysis, machine learning, and data-driven insights"
    - name: "other"
      slug: "other"
      color: "#6B7280"
      description: "miscellaneous topics and general technology discussions"

# UI Text (keeping your existing structure)
uiText:
  audioAvailableLabel: "🎧 audio available"
  audioTitle: "listen to this article"
  audioSubtitle: "perfect for multitasking or commuting"
  noAudioText: "audio version coming soon"
  byAuthorPrefix: "by"
  aboutAuthorTitle: "about the author"
  shareLabel: "share"
  shareArticleTitle: "share article"
  continueReadingTitle: "continue reading"
  continueReadingSubtitle: "explore more insights from tinkbyte"
  previousArticleLabel: "previous article"
  nextArticleLabel: "next article"
  reachedBeginningText: "you've reached the beginning"
  readAllText: "you've read it all!"
  browseAllArticlesText: "browse all articles"
  tocTitle: "table of contents"
  topicsTitle: "topics"
  readingProgressTitle: "reading progress"
  imageCreditText: "photo by tinkbyte team"
  readingTimePrefix: "reading time:"
  defaultCategoryLabel: "article"
  discussionTitle: "join the discussion"
  discussionSubtitle: "share your thoughts and connect with other builders"
  relatedTitle: "more from tinkbyte"
  relatedSubtitle: "discover more insights that matter to builders"

# Community settings (keeping your existing structure)
community:
  stats:
    - number: "1,200+"
      label: "active members"
      icon: "users"
    - number: "45"
      label: "countries"
      icon: "globe"
    - number: "150+"
      label: "projects shared"
      icon: "tools"
    - number: "24/7"
      label: "support available"
      icon: "heart"
  platforms:
    - name: "discord"
      description: "real-time discussions, tech support, and community hangouts"
      icon: "discord"
      link: "https://discord.gg/tinkbyte"
      members: "800+"
      activity: "very active"
      color: "purple"
      featured: true
    - name: "github"
      description: "open source projects, code reviews, and collaboration"
      icon: "github"
      link: "https://github.com/tinkbyte"
      members: "300+"
      activity: "daily commits"
      color: "gray"
      featured: true
    - name: "linkedin"
      description: "professional networking and industry insights"
      icon: "linkedin"
      link: "https://linkedin.com/company/tinkbytehq"
      members: "2,500+"
      activity: "weekly updates"
      color: "blue"
      featured: true
    - name: "twitter"
      description: "quick updates, tech news, and community highlights"
      icon: "twitter"
      link: "https://twitter.com/tinkbytehq"
      members: "5,000+"
      activity: "daily posts"
      color: "blue"
      featured: true
    - name: "instagram"
      description: "visual stories, behind-the-scenes, and community highlights"
      icon: "instagram"
      link: "https://instagram.com/tinkbytehq"
      members: "1,000+"
      activity: "daily updates"
      color: "pink"
      featured: false
    - name: "youtube"
      description: "video tutorials, tech talks, and community showcases"
      icon: "youtube"
      link: "https://youtube.com/@tinkbytehq"
      members: "800+"
      activity: "weekly videos"
      color: "red"
      featured: false
    - name: "substack"
      description: "weekly newsletter with insights, tips, and community news"
      icon: "substack"
      link: "https://tinkbyte.substack.com"
      members: "1,500+"
      activity: "weekly posts"
      color: "orange"
      featured: true

# Research settings (keeping your existing structure)
research:
  stats:
    - number: "30+"
      label: "research projects"
      icon: "chart-line"
    - number: "15"
      label: "published reports"
      icon: "file-alt"
    - number: "500+"
      label: "contributors"
      icon: "users"
    - number: "12M+"
      label: "data points"
      icon: "database"
  reports:
    - title: "state of african fintech 2024"
      description: "comprehensive analysis of fintech growth, challenges, and opportunities across african markets"
      date: 2024-01-15T00:00:00.000Z
      type: "industry-analysis"
      pages: 48
      downloads: "2,300+"
      downloadUrl: "/reports/african-fintech-2024.pdf"
      coverImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop"
      featured: true
      tags:
        - "fintech"
        - "africa"
        - "market-analysis"
        - "digital-payments"
    - title: "ai implementation guide for smes"
      description: "practical framework for small and medium enterprises to adopt ai technologies effectively"
      date: 2024-02-20T00:00:00.000Z
      type: "technical-deep-dive"
      pages: 32
      downloads: "1,800+"
      downloadUrl: "/reports/ai-implementation-sme.pdf"
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop"
      featured: true
      tags:
        - "ai"
        - "sme"
        - "implementation"
        - "business-strategy"
    - title: "remote team collaboration study"
      description: "analysis of productivity patterns and best practices from 200+ distributed teams"
      date: 2024-03-10T00:00:00.000Z
      type: "user-study"
      pages: 24
      downloads: "1,200+"
      downloadUrl: "/reports/remote-collaboration-study.pdf"
      coverImage: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"
      featured: false
      tags:
        - "remote-work"
        - "collaboration"
        - "productivity"
        - "team-management"
---

# site configuration

this file contains all the main site settings and configuration options for tinkbyte including comprehensive social media platform support, community settings, research configuration, and ui customization.

## enhanced social media support

now includes all major platforms with individual configuration options for footer display, sharing capabilities, and featured status.

## maintained existing structure

all your existing categories, ui text, community stats, and research reports have been preserved while adding the new social media capabilities.