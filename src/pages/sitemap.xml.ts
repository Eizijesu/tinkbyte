// src/pages/sitemap.xml.ts - UPDATED for your 21 categories
import type { APIRoute } from "astro";
import { getPublishedPosts, getAllCategoriesWithStats, getPublishedNewsletters } from "../utils/content"; // Fixed path
import { getAllCategories, getAllNewsletters } from "../config/site";

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
      { url: "newsletters", priority: 0.8, changefreq: "weekly" },
      { url: "audio", priority: 0.7, changefreq: "weekly" },
      { url: "search", priority: 0.6, changefreq: "weekly" },
      { url: "archive", priority: 0.6, changefreq: "weekly" },
      { url: "featured", priority: 0.7, changefreq: "daily" },
      { url: "community", priority: 0.7, changefreq: "weekly" },
      { url: "research", priority: 0.6, changefreq: "monthly" },
      { url: "tags", priority: 0.5, changefreq: "weekly" },
      { url: "authors", priority: 0.5, changefreq: "monthly" },
      // Legal pages
      { url: "legal/privacy-policy", priority: 0.3, changefreq: "yearly" },
      { url: "legal/terms-of-service", priority: 0.3, changefreq: "yearly" },
      { url: "legal/cookie-policy", priority: 0.3, changefreq: "yearly" },
    ];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url ? `/${page.url}` : ""}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>`,
    )
    .join("")}
  ${blogPosts
    .map((post) => {
      const lastmod = post.data.updatedDate 
        ? new Date(post.data.updatedDate).toISOString().split("T")[0]
        : new Date(post.data.pubDate).toISOString().split("T")[0];
      
      const priority = post.data.featured ? "0.9" : post.data.trending ? "0.85" : "0.8";
      
      return `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
    <lastmod>${lastmod}</lastmod>
    ${post.data.heroImage?.externalUrl || post.data.heroImage?.uploadedImage || post.data.image ? `
    <image:image>
      <image:loc>${post.data.heroImage?.externalUrl || post.data.heroImage?.uploadedImage || post.data.image}</image:loc>
      <image:caption>${post.data.heroImage?.alt || post.data.imageAlt || post.data.title}</image:caption>
      <image:title>${post.data.title}</image:title>
    </image:image>` : ''}
  </url>`;
    })
    .join("")}
  ${categories
    .map((category) => {
      const lastmod = category.stats.lastUpdated.toISOString().split("T")[0];
      return `
  <url>
    <loc>${baseUrl}/blog/category/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    })
    .join("")}
  ${newsletters
    .map((newsletter) => {
      const lastmod = new Date(newsletter.data.publishDate).toISOString().split("T")[0];
      return `
  <url>
    <loc>${baseUrl}/newsletters/${newsletter.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    })
    .join("")}
  ${getAllNewsletters()
    .map((newsletter) => `
  <url>
    <loc>${baseUrl}/newsletters/${newsletter.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>`)
    .join("")}
</urlset>`.trim();

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
};