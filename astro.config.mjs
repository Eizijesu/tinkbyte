// astro.config.mjs - Enhanced TinkByte Configuration (CORRECTED)
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
//import compress from 'astro-compress';
import robotsTxt from 'astro-robots-txt';

// Import rehype and remark plugins for enhanced markdown processing
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  // Site configuration
  site: 'https://tinkbyte.com', // Replace with your actual domain
  
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
      applyBaseStyles: false, // We're using our custom global.css
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
      sitemap: 'https://tinkbyte.com/sitemap-index.xml', // Replace with your domain
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
    
    // Compression for better performance (should be last) - COMMENTED OUT
    // compress({
    //   CSS: true,
    //   HTML: {
    //     'html-minifier-terser': {
    //       removeAttributeQuotes: false,
    //       collapseWhitespace: true,
    //       removeComments: true,
    //       sortClassName: true,
    //       sortAttributes: true,
    //     },
    //   },
    //   Image: false, // Handle images separately for better control
    //   JavaScript: true,
    //   SVG: true,
    // }),
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
  },

  // Vite configuration for enhanced development
  vite: {
    optimizeDeps: {
      include: ['react', 'react-dom', 'date-fns', 'fuse.js'],
      exclude: ['shiki'] // ✅ ADDED: Exclude shiki from optimization
    },
    ssr: {
      noExternal: ['shiki'] // ✅ FIXED: Moved inside vite config properly
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
    domains: ['images.unsplash.com', 'cdn.tinkbyte.com'], // Add your image domains
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

  // Remove the experimental object entirely since it's empty
  // If you need experimental features in the future, add them like this:
  // experimental: {
  //   contentCollectionCache: true,
  //   optimizeHoistedScript: true,
  // },
});
