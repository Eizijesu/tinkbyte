// src/pages/sitemap.xml.ts - FIXED XML ENCODING
import type { APIRoute } from "astro";
import { getPublishedPosts, getAllCategoriesWithStats, getPublishedNewsletters } from "../utils/content";
import { getAllCategories, getAllNewsletters } from "../config/site";

// Helper function to escape XML entities
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Helper function to ensure proper URL format
function formatUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return escapeXml(`${cleanBase}${cleanPath}`);
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.toString() || "https://tinkbyte.com";

  try {
    // Get all published content
    const [blogPosts, categories, newsletters] = await Promise.all([
      getPublishedPosts(),
      getAllCategoriesWithStats(),
      getPublishedNewsletters()
    ]);

    // Static pages with priorities and change frequencies
    const staticPages = [
      { url: "", priority: 1.0, changefreq: "daily" },
      { url: "about", priority: 0.8, changefreq: "monthly" },
      { url: "blog", priority: 0.9, changefreq: "daily" },
      { url: "blog/categories", priority: 0.8, changefreq: "weekly" },
      { url: "contact", priority: 0.7, changefreq: "monthly" },
      { url: "newsletter", priority: 0.8, changefreq: "weekly" },
      { url: "podcast", priority: 0.7, changefreq: "weekly" },
      { url: "search", priority: 0.6, changefreq: "weekly" },
      { url: "subscribe", priority: 0.6, changefreq: "weekly" },
      { url: "research", priority: 0.6, changefreq: "monthly" },
      { url: "blog/authors", priority: 0.5, changefreq: "monthly" },
      // Legal pages
      { url: "legal/privacy-policy", priority: 0.3, changefreq: "yearly" },
      { url: "legal/terms-of-service", priority: 0.3, changefreq: "yearly" },
      { url: "legal/cookie-policy", priority: 0.3, changefreq: "yearly" },
    ];

    const currentDate = new Date().toISOString().split("T")[0];

    // Generate XML with proper escaping
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticPages
  .map((page) => `  <url>
    <loc>${formatUrl(baseUrl, page.url)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${currentDate}</lastmod>
  </url>`)
  .join('\n')}
${blogPosts
  .map((post) => {
    const lastmod = post.data.updatedDate 
      ? new Date(post.data.updatedDate).toISOString().split("T")[0]
      : new Date(post.data.pubDate).toISOString().split("T")[0];
    
    const priority = post.data.featured ? "0.9" : post.data.trending ? "0.85" : "0.8";
    
    // Get image URL and escape it
    const imageUrl = post.data.heroImage?.externalUrl || 
                    post.data.heroImage?.uploadedImage || 
                    post.data.image;
    
    const imageTitle = escapeXml(post.data.heroImage?.alt || 
                               post.data.imageAlt || 
                               post.data.title || '');
    
    const postTitle = escapeXml(post.data.title || '');
    
    return `  <url>
    <loc>${formatUrl(baseUrl, `blog/${post.slug}`)}</loc>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
    <lastmod>${lastmod}</lastmod>${imageUrl ? `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:caption>${imageTitle}</image:caption>
      <image:title>${postTitle}</image:title>
    </image:image>` : ''}
  </url>`;
  })
  .join('\n')}
${categories
  .map((category) => {
    const lastmod = category.stats?.lastUpdated 
      ? category.stats.lastUpdated.toISOString().split("T")[0]
      : currentDate;
    
    return `  <url>
    <loc>${formatUrl(baseUrl, `blog/categories/${category.slug}`)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  })
  .join('\n')}
${newsletters
  .map((newsletter) => {
    const lastmod = new Date(newsletter.data.publishDate).toISOString().split("T")[0];
    return `  <url>
    <loc>${formatUrl(baseUrl, `newsletter/${newsletter.slug}`)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  })
  .join('\n')}
${getAllNewsletters()
  .map((newsletter) => `  <url>
    <loc>${formatUrl(baseUrl, `newsletter/${newsletter.slug}`)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>${currentDate}</lastmod>
  </url>`)
  .join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // Return a minimal valid sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(baseUrl)}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>
</urlset>`;

    return new Response(fallbackXml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }
};