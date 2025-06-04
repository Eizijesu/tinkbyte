import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => {
    return !data.draft;
  });

  return rss({
    title: 'TinkByte | Digital Tech Innovation Weekly',
    description: 'TinkByte delivers practical tech insights and innovation analysis without the hype. Weekly articles on AI, product development, and emerging technologies.',
    site: context.site,
    items: posts
      .sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
      .map((post) => ({
        title: post.data.title,
        pubDate: new Date(post.data.pubDate),
        description: post.data.excerpt,
        link: `/blog/${post.slug}/`,
        author: post.data.author || 'TinkByte Team',
        categories: post.data.tags || [],
        customData: `
          <author>${post.data.author || 'TinkByte Team'}</author>
          <content:encoded><![CDATA[${post.data.excerpt}]]></content:encoded>
          ${post.data.readTime ? `<readTime>${post.data.readTime}</readTime>` : ''}
          ${post.data.category ? `<category>${post.data.category}</category>` : ''}
        `,
      })),
    customData: `
      <language>en-us</language>
      <managingEditor>hello@tinkbyte.com (TinkByte Editorial Team)</managingEditor>
      <webMaster>hello@tinkbyte.com (TinkByte Technical Team)</webMaster>
      <copyright>Copyright ${new Date().getFullYear()} TinkByte. All rights reserved.</copyright>
      <category>Technology</category>
      <category>AI</category>
      <category>Product Development</category>
      <category>Startup</category>
      <ttl>60</ttl>
      <image>
        <url>https://tinkbyte.com/logo.png</url>
        <title>TinkByte</title>
        <link>https://tinkbyte.com</link>
        <width>144</width>
        <height>144</height>
        <description>TinkByte - Digital Tech Innovation Weekly</description>
      </image>
    `,
  });
}
