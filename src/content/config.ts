// src/content/config.ts
import { defineCollection, z } from "astro:content";

// Blog collection schema
const blogCollection = defineCollection({
  schema: z.object({
    title: z.string().max(100),
    excerpt: z.string().max(160),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    author: z.string().default("TinkByte Team"),
    authorBio: z.string().optional(),
    authorAvatar: z.string().optional(),
    authorRole: z.string().optional(),
    authorSocial: z
      .object({
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
        github: z.string().optional(),
      })
      .optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string(),
    featured: z.boolean().default(false),
    trending: z.boolean().default(false),
    draft: z.boolean().default(false),
    readTime: z.string().optional(),
    audioUrl: z.string().optional(),
    audioDuration: z.string().optional(),
    audioTranscript: z.string().optional(),
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        canonical: z.string().optional(),
        noindex: z.boolean().default(false),
      })
      .optional(),
  }),
});

// Authors collection
const authorsCollection = defineCollection({
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string(),
    role: z.string(),
    company: z.string().optional(), // Added from first version
    email: z.string().email().optional(),
    social: z
      .object({
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
        github: z.string().optional(),
        website: z.string().optional(),
      })
      .optional(),
    featured: z.boolean().default(false),
  }),
});

// Categories collection
const categoriesCollection = defineCollection({
  schema: z.object({
    name: z.string(),
    description: z.string(),
    color: z
      .enum(["blue", "purple", "green", "orange", "red", "cyan", "pink", "yellow"]) // Extended color options
      .default("blue"),
    icon: z.string().default("tag"),
    featured: z.boolean().default(false),
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
      })
      .optional(),
  }),
});

// Podcast collection (was missing)
const podcastCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    duration: z.string(),
    audioUrl: z.string(),
    image: z.string().optional(),
    guests: z.array(z.string()).optional(),
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

// Newsletter collection
const newsletterCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    pubDate: z.date(),
    issue: z.number(),
    featured: z.boolean().default(false),
  }),
});

// Pages collection
const pagesCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    layout: z.string().optional(), // Added from first version
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        canonical: z.string().optional(),
        noindex: z.boolean().default(false), // Added from first version
      })
      .optional(),
  }),
});

export const collections = {
  blog: blogCollection,
  authors: authorsCollection,
  categories: categoriesCollection,
  podcast: podcastCollection, // This was missing
  newsletter: newsletterCollection,
  pages: pagesCollection,
};
