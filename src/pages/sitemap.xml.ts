import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.toString() || "https://tinkbyte.com";

  // Get all blog posts
  const blogPosts = await getCollection("blog", ({ data }) => {
    return data.draft !== true;
  });

  // Static pages with their priorities and change frequencies
  const staticPages = [
    { url: "", priority: 1.0, changefreq: "daily" },
    { url: "about", priority: 0.8, changefreq: "monthly" },
    { url: "blog", priority: 0.9, changefreq: "daily" },
    { url: "contact", priority: 0.7, changefreq: "monthly" },
    { url: "newsletter", priority: 0.8, changefreq: "weekly" },
    { url: "search", priority: 0.6, changefreq: "weekly" },
    { url: "archive", priority: 0.6, changefreq: "weekly" },
    { url: "featured", priority: 0.7, changefreq: "weekly" },
    { url: "community", priority: 0.7, changefreq: "weekly" },
    { url: "privacy", priority: 0.3, changefreq: "yearly" },
    { url: "terms", priority: 0.3, changefreq: "yearly" },
  ];

  // Category pages
  const categories = [
    "ai-evolution",
    "product-insights",
    "tech-culture",
    "startup-lessons",
    "tools-resources",
    "industry-news",
    "emerging-tech",
    "developer-tools",
  ];

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
    .map(
      (post) => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <lastmod>${post.data.updatedDate ? post.data.updatedDate.toISOString().split("T")[0] : post.data.pubDate.toISOString().split("T")[0]}</lastmod>
  </url>`,
    )
    .join("")}
  ${categories
    .map(
      (category) => `
  <url>
    <loc>${baseUrl}/category/${category}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>`,
    )
    .join("")}
</urlset>`.trim();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
