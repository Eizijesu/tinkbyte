// astro.config.mjs - Enhanced TinkByte Configuration (FIXED)
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
  
  // Integrations
  integrations: [
    // MDX for enhanced markdown with React components
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
    
    // React for interactive components
    react(),
    
    // Tailwind CSS with custom configuration
    tailwind({
      applyBaseStyles: false,
      configFile: './tailwind.config.mjs',
    }),
    
    // Sitemap generation
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      entryLimit: 45000,
    }),
    
    // Robots.txt generation
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

  vite: {
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
    },
    // ADDED: Global component registration
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

  // Vite configuration for enhanced development
  vite: {
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
