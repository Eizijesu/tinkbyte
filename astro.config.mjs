// astro.config.mjs - FIXED VERSION
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

// Import rehype and remark plugins for enhanced markdown processing
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  // Site configuration
  site: 'https://tinkbyte.com',

  redirects: {
    '/privacy': '/legal/privacy-policy',
    '/terms': '/legal/terms-of-service',
    '/cookies': '/legal/cookie-policy',
    '/legal/contact': '/contact', 
  },
  
  // Integrations
  integrations: [
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'github-dark',
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        wrap: true,
        transformers: [],
      },
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'wrap',
            properties: {
              className: ['anchor-link'],
              ariaLabel: 'Link to this section',
            },
          },
        ],
      ],
    }),
    
    
    react(),
    tailwind({
      applyBaseStyles: false,
      configFile: './tailwind.config.mjs',
    }),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      entryLimit: 45000,
    }),
    robotsTxt({
      sitemap: 'https://tinkbyte.com/sitemap-index.xml',
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin/', '/api/', '/_astro/', '/tina/'],
        },
        {
          userAgent: 'GPTBot',
          disallow: '/',
        },
        {
          userAgent: 'ChatGPT-User',
          disallow: '/',
        },
      ],
    }),
  ], 

  // Markdown configuration
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: {
            className: ['anchor-link'],
            ariaLabel: 'Link to this section',
          },
        },
      ],
    ],
    extendMarkdownConfig: false,
  },

  // Vite configuration - CLEANED UP
  vite: {
    resolve: {
      alias: {
        '/lib/supabase': '/src/lib/supabase.js',
        '/lib/auth': '/src/lib/auth.js',
        '@/lib/supabase': '/src/lib/supabase.js',
        '@/lib/auth': '/src/lib/auth.js',
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'date-fns', 'fuse.js'],
      exclude: ['shiki'],
    },
    ssr: {
      noExternal: ['shiki'],
    },
    css: {
      devSourcemap: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'date-vendor': ['date-fns'],
            'search-vendor': ['fuse.js'],
          },
        },
      },
    },
    server: {
      fs: {
        allow: ['..'],
      },
       middlewareMode: false,
    },
    
    // Clean define section - removed problematic env var aliases
    define: {
      'globalThis.astroMDXComponents': JSON.stringify({
        ImageBlock: true,
        VideoBlock: true,
        Callout: true,
        ButtonBlock: true,
        CodeBlock: true,
        Quote: true,
        TableBlock: true,
        ImageGallery: true,
        Newsletter: true,
        TwoColumnLayout: true,
      }),
    },
  },

  // Build configuration
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro',
  },

  // Output configuration
  output: 'static',
  
  // Server configuration for development
  server: {
    port: 4321,
    host: true,
  },

  // Preview configuration
  preview: {
    port: 4322,
    host: true,
  },

  // Prefetch configuration
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  // Image optimization
  image: {
    domains: ['images.unsplash.com', 'cdn.tinkbyte.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },

  // Security headers
  security: {
    checkOrigin: true,
  },
});