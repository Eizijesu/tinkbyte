import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://tinkbyte.com',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
    sitemap(),
    // Remove rss() from here - we'll create an endpoint instead
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'github-dark-dimmed',
        themes: {
          light: 'github-light',
          dark: 'github-dark-dimmed'
        }
      },
      remarkPlugins: ['remark-gfm'],
      rehypePlugins: [
        'rehype-slug',
        ['rehype-autolink-headings', { behavior: 'wrap' }]
      ]
    })
  ],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark-dimmed',
      themes: {
        light: 'github-light', 
        dark: 'github-dark-dimmed'
      }
    }
  },
  vite: {
    optimizeDeps: {
      exclude: ['@tinacms/cli']
    }
  },
  output: 'static',
  adapter: undefined
});
