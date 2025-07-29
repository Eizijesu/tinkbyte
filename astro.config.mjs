// astro.config.mjs - CORRECTED VERSION
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

// Import rehype and remark plugins
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  site: 'https://tinkbyte.com',
  trailingSlash: 'never',
  
  redirects: {
    '/privacy': '/legal/privacy-policy',
    '/terms': '/legal/terms-of-service',
    '/cookies': '/legal/cookie-policy',
    '/legal/contact': '/contact', 
  },
  
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
  },

  
  vite: {
    optimizeDeps: {
      include: ['react', 'react-dom', 'date-fns', 'fuse.js'],
      exclude: ['shiki'],
    },
    ssr: {
      noExternal: ['shiki'],
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
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
        allow: ['..',  './public'],
      },
    },
  },

  
  build: {
    format: 'file',
    inlineStylesheets: 'auto',
    assets: '_astro',
  },

  output: 'static',
  
  server: {
    port: 4321,
    host: true,
  },

  preview: {
    port: 4322,
    host: true,
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  image: {
    domains: ['images.unsplash.com', 'cdn.tinkbyte.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },

  security: {
    checkOrigin: true,
  },
});