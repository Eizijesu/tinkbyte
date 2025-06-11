---
title: "Global Site Settings"
description: "Site-wide configuration and content"
site:
  name: "TinkByte"
  description: "Building meaningful, data-driven products that solve real problems"
  url: "https://tinkbyte.com"
  logo: "/images/logo.png"
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
categories:
  defaultColor: "#6b7280"
  categoryMappings:
    # Existing categories
    - name: "build-thinking"
      slug: "build-thinking"
      color: "#1A73E8"
      description: "How products actually get made - practical insights from the trenches"
    - name: "community-innovation"
      slug: "community-innovation"
      color: "#10B981"
      description: "How communities drive breakthrough innovation"
    - name: "learning-by-doing"
      slug: "learning-by-doing"
      color: "#EA4335"
      description: "Real lessons from failures, MVPs, and successful launches"
    - name: "no-fluff-coverage"
      slug: "no-fluff-coverage"
      color: "#FF9800"
      description: "Direct insights without the marketing speak"
    - name: "research-backed"
      slug: "research-backed"
      color: "#FBBC04"
      description: "Data-driven insights and evidence-based content"
    - name: "global-perspective"
      slug: "global-perspective"
      color: "#9C27B0"
      description: "Innovation stories from around the world"
    - name: "ai-evolution"
      slug: "ai-evolution"
      color: "#8B5CF6"
      description: "Practical AI insights beyond the hype"
    - name: "product-strategy"
      slug: "product-strategy"
      color: "#F59E0B"
      description: "Strategic approaches to product development"
    - name: "developer-tools"
      slug: "developer-tools"
      color: "#06B6D4"
      description: "Tools and technologies that make developers more productive"
    - name: "tech-culture"
      slug: "tech-culture"
      color: "#8B5CF6"
      description: "Culture, teams, and human aspects of technology"
    # ADD NEW CATEGORIES HERE:
    - name: "privacy-security"
      slug: "privacy-security"
      color: "#DC2626"
      description: "Privacy protection and security best practices"
    - name: "mobile-development"
      slug: "mobile-development"
      color: "#059669"
      description: "Mobile app development and mobile-first strategies"
    - name: "cloud-technologies"
      slug: "cloud-technologies"
      color: "#0284C7"
      description: "Cloud platforms, serverless, and distributed systems"
    - name: "data-science"
      slug: "data-science"
      color: "#7C3AED"
      description: "Data analysis, machine learning, and data-driven insights"
    - name: "other"
      slug: "other"
      color: "#6B7280"
      description: "Miscellaneous topics and general technology discussions"
community:
  stats:
    - number: "1,200+"
      label: "Active Members"
      icon: "users"
    - number: "45"
      label: "Countries"
      icon: "globe"
    - number: "150+"
      label: "Projects Shared"
      icon: "tools"
    - number: "24/7"
      label: "Support Available"
      icon: "heart"
  platforms:
    - name: "Discord"
      description: "Real-time discussions, tech support, and community hangouts"
      icon: "discord"
      link: "https://discord.gg/tinkbyte"
      members: "800+"
      activity: "Very Active"
      color: "purple"
    - name: "GitHub"
      description: "Open source projects, code reviews, and collaboration"
      icon: "github"
      link: "https://github.com/tinkbyte"
      members: "300+"
      activity: "Daily Commits"
      color: "gray"
    - name: "LinkedIn"
      description: "Professional networking and industry insights"
      icon: "linkedin"
      link: "https://linkedin.com/company/tinkbytehq"
      members: "2,500+"
      activity: "Weekly Updates"
      color: "blue"
    - name: "Twitter"
      description: "Quick updates, tech news, and community highlights"
      icon: "twitter"
      link: "https://twitter.com/tinkbytehq"
      members: "5,000+"
      activity: "Daily Posts"
      color: "blue"
research:
  stats:
    - number: "30+"
      label: "Research Projects"
      icon: "chart-line"
    - number: "15"
      label: "Published Reports"
      icon: "file-alt"
    - number: "500+"
      label: "Contributors"
      icon: "users"
    - number: "12M+"
      label: "Data Points"
      icon: "database"
  reports:
    - title: "State of African Fintech 2024"
      description: "Comprehensive analysis of fintech growth, challenges, and opportunities across African markets"
      date: 2024-01-15T00:00:00.000Z
      type: "industry-analysis"
      pages: 48
      downloads: "2,300+"
      downloadUrl: "/reports/african-fintech-2024.pdf"
      coverImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop"
      featured: true
      tags: ["fintech", "africa", "market-analysis", "digital-payments"]
    - title: "AI Implementation Guide for SMEs"
      description: "Practical framework for small and medium enterprises to adopt AI technologies effectively"
      date: 2024-02-20T00:00:00.000Z
      type: "technical-deep-dive"
      pages: 32
      downloads: "1,800+"
      downloadUrl: "/reports/ai-implementation-sme.pdf"
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop"
      featured: true
      tags: ["ai", "sme", "implementation", "business-strategy"]
    - title: "Remote Team Collaboration Study"
      description: "Analysis of productivity patterns and best practices from 200+ distributed teams"
      date: 2024-03-10T00:00:00.000Z
      type: "user-study"
      pages: 24
      downloads: "1,200+"
      downloadUrl: "/reports/remote-collaboration-study.pdf"
      coverImage: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"
      featured: false
      tags: ["remote-work", "collaboration", "productivity", "team-management"]
newsletter:
  title: "TinkStacks Weekly"
  subtitle: "Weekly insights on AI, tech, and innovation delivered to your inbox"
  frequency: "weekly"
  subscriberCount: "1,200+"
  signupFormId: "newsletter-signup"
  confirmationMessage: "Thanks for subscribing! Check your email to confirm your subscription."
uiText:
  audioAvailableLabel: "🎧 Audio Available"
  audioTitle: "Listen to this article"
  audioSubtitle: "Perfect for multitasking or commuting"
  noAudioText: "Audio version coming soon"
  byAuthorPrefix: "By"
  aboutAuthorTitle: "About the Author"
  shareLabel: "Share"
  shareArticleTitle: "Share Article"
  continueReadingTitle: "Continue Reading"
  continueReadingSubtitle: "Explore more insights from TinkByte"
  previousArticleLabel: "Previous Article"
  nextArticleLabel: "Next Article"
  reachedBeginningText: "You've reached the beginning"
  readAllText: "You've read it all!"
  browseAllArticlesText: "Browse All Articles"
  tocTitle: "Table of Contents"
  topicsTitle: "Topics"
  readingProgressTitle: "Reading Progress"
  imageCreditText: "Photo by TinkByte Team"
  readingTimePrefix: "Reading time:"
  defaultCategoryLabel: "ARTICLE"
  discussionTitle: "Join the Discussion"
  discussionSubtitle: "Share your thoughts and connect with other builders"
  relatedTitle: "More from TinkByte"
  relatedSubtitle: "Discover more insights that matter to builders"
social:
  platforms:
    - name: "twitter"
      url: "https://twitter.com/tinkbythq"
      username: "tinkbyte"
      showInFooter: true
      enableSharing: true
    - name: "linkedin"
      url: "https://linkedin.com/company/tinkbytehq"
      username: "tinkbyte"
      showInFooter: true
      enableSharing: true
    - name: "github"
      url: "https://github.com/tinkbyte"
      username: "tinkbyte"
      showInFooter: true
      enableSharing: false
    - name: "discord"
      url: "https://discord.gg/tinkbyte"
      username: "tinkbyte"
      showInFooter: true
      enableSharing: false
  defaultShareText: "Check out this insightful article from TinkByte - building meaningful tech products that solve real problems."
analytics:
  googleAnalyticsId: ""
  googleTagManagerId: ""
  enableCookieConsent: false
  cookieConsentMessage: "We use cookies to enhance your browsing experience and analyze our traffic."
performance:
  enableImageOptimization: true
  enableLazyLoading: true
  enableServiceWorker: false
  cacheMaxAge: 24
---

# Global Site Settings

This file contains all site-wide configuration including community stats, research data, and UI text settings.

## Key Features

- **Community Statistics**: Real member counts and engagement metrics
- **Research Reports**: Published studies and downloadable resources
- **Social Media Integration**: Platform links and sharing configuration
- **UI Customization**: All user-facing text and labels
- **Performance Settings**: Optimization and caching preferences

## Usage

These settings are automatically loaded throughout the site and can be edited through TinaCMS admin interface.