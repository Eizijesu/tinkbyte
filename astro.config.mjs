// astro.config.mjs - Corrected Version (No Outdated Experimental Features)
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

// @ts-ignore - Environment variable typing
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

export default defineConfig({
  site: 'https://tinkbyte.com',
  trailingSlash: 'never',
  
  // Enhanced redirects for better SEO
  redirects: {
    '/privacy': '/legal/privacy-policy',
    '/terms': '/legal/terms-of-service',
    '/cookies': '/legal/cookie-policy',
    '/legal/contact': '/contact',
    '/categories': '/blog/categories',
    '/tags': '/blog/tags',
    '/authors': '/blog/authors',
    // Handle old blog structure
    //'/posts/[...slug]': '/blog/[...slug]',
    //'/articles/[...slug]': '/blog/[...slug]',
  },
  
  integrations: [
    // MDX Configuration
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
    
    // React Configuration
    react({
      include: ['**/react/*'],
    }),
    
    // Tailwind Configuration
    tailwind({
      applyBaseStyles: false,
      configFile: './tailwind.config.mjs',
    }),
    
    // Sitemap Configuration
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      entryLimit: 45000,
      serialize(item) {
        // @ts-ignore - Sitemap item typing
        if (item.url.includes('/blog/')) {
          item.priority = 0.8;
          item.changefreq = 'daily';
        }
        // @ts-ignore - Sitemap item typing
        if (item.url.includes('/categories/') || item.url.includes('/tags/')) {
          item.priority = 0.6;
          item.changefreq = 'weekly';
        }
        return item;
      },
    }),
    
    // Robots.txt Configuration
    robotsTxt({
      sitemap: [
        'https://tinkbyte.com/sitemap-index.xml',
        'https://tinkbyte.com/sitemap-0.xml',
      ],
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: [
            '/admin/',
            '/api/',
            '/_astro/',
            '/tina/',
            '/auth/callback',
            '/auth/verify',
            '/auth/reset-password',
            '/*.json',
            '/search?*',
          ],
          crawlDelay: 1,
        },
        {
          userAgent: 'GPTBot',
          disallow: '/',
        },
        {
          userAgent: 'ChatGPT-User',
          disallow: '/',
        },
        {
          userAgent: 'CCBot',
          disallow: '/',
        },
        {
          userAgent: 'anthropic-ai',
          disallow: '/',
        },
        {
          userAgent: 'Claude-Web',
          disallow: '/',
        },
      ],
      host: 'https://tinkbyte.com',
    }),
  ], 

  // Markdown Configuration
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
    gfm: true,
    smartypants: true,
  },

  // Vite Configuration
  vite: {
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'date-fns', 
        'fuse.js',
        '@supabase/supabase-js',
      ],
      exclude: [
        'shiki',
        '@astrojs/mdx',
      ],
    },
    
    // SSR Configuration
    ssr: {
      noExternal: [
        'shiki',
        '@supabase/supabase-js',
      ],
    },
    
    // Build Configuration
    build: {
      target: 'es2020',
      minify: isProd ? 'esbuild' : false,
      sourcemap: isDev,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom'],
            'date-vendor': ['date-fns'],
            'search-vendor': ['fuse.js'],
            'supabase-vendor': ['@supabase/supabase-js'],
          },
          
          // Asset naming for better caching
          entryFileNames: isProd ? 'assets/[name].[hash].js' : 'assets/[name].js',
          chunkFileNames: isProd ? 'assets/[name].[hash].js' : 'assets/[name].js',
          assetFileNames: isProd ? 'assets/[name].[hash][extname]' : 'assets/[name][extname]',
        },
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
    
    // Development server configuration
    server: {
      fs: {
        allow: ['..', './public', './src'],
        strict: false,
      },
      host: true,
      port: 4321,
      strictPort: false,
      open: false,
    },
    
    // Environment variables
    define: {
      __DEV__: isDev,
      __PROD__: isProd,
    },
    
    // CSS Configuration
    css: {
      devSourcemap: isDev,
    },
    
    // ESBuild configuration for TypeScript
    esbuild: {
      logOverride: { 
        'this-is-undefined-in-esm': 'silent',
        'empty-import-meta': 'silent'
      }
    }
  },

  // Build Configuration
  build: {
    format: 'file',
    inlineStylesheets: 'auto',
    assets: '_astro',
    splitting: true,
  },

  // Output Configuration
  output: 'static',
  
  // Development Server
  server: {
    port: 4321,
    host: true,
    open: false,
  },

  // Preview Server
  preview: {
    port: 4322,
    host: true,
    open: false,
  },

  // Prefetch Configuration
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  // Image Configuration
  image: {
    domains: [
      'images.unsplash.com', 
      'cdn.tinkbyte.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },

  // Security Configuration
  security: {
    checkOrigin: true,
  },

  // ❌ REMOVED OUTDATED EXPERIMENTAL FEATURES
  // These were causing the error:
  // experimental: {
  //   contentCollectionCache: true,    // ❌ Outdated
  //   optimizeHoistedScript: true,     // ❌ Outdated  
  //   clientPrerender: true,           // ❌ Outdated
  // },

  // Compiler Configuration for TypeScript
  compilerOptions: {
    // @ts-ignore - TypeScript compiler options
    typescript: {
      strict: false,
      noImplicitAny: false,
      noUnusedLocals: false,
      noUnusedParameters: false,
      skipLibCheck: true,
    },
  },

  // Base Configuration
  base: '/',
  
  // Public Directory
  publicDir: './public',
  
  // Source Directory  
  srcDir: './src',
  
  // Output Directory
  outDir: './dist',
  
  // Cache Directory
  cacheDir: './node_modules/.astro',
});