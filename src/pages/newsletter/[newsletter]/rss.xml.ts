// src/pages/newsletters/[newsletter]/rss.xml.ts - NEW
import rss from '@astrojs/rss';
import { getNewslettersByType } from '../../../utils/content';
import { SITE, getAllNewsletters } from '../../../config/site';
import type { APIRoute } from 'astro';

export async function getStaticPaths() {
  const newsletters = getAllNewsletters();
  
  return newsletters.map(newsletter => ({
    params: { newsletter: newsletter.slug },
    props: { 
      newsletterName: newsletter.name,
      newsletterDescription: newsletter.description,
      frequency: newsletter.frequency
    }
  }));
}

export const GET: APIRoute = async (context) => {
  try {
    const { newsletter } = context.params;
    const { newsletterName, newsletterDescription, frequency } = context.props;
    const issues = await getNewslettersByType(newsletter as any);
    
    return rss({
      title: `${newsletterName} | ${SITE.name}`,
      description: `${newsletterDescription} - ${frequency}`,
      site: context.site?.toString() || SITE.url,
      items: issues.map((issue) => ({
        title: issue.data.title,
        pubDate: new Date(issue.data.publishDate),
        description: issue.data.excerpt,
        link: `/newsletters/${newsletter}/${issue.slug}/`,
        categories: [newsletterName, ...(issue.data.tags || [])],
        customData: `
          <newsletter>${newsletterName}</newsletter>
          <issueNumber>${issue.data.issueNumber}</issueNumber>
          <frequency>${frequency}</frequency>
          ${issue.data.featured ? '<featured>true</featured>' : ''}
          ${issue.data.subscriberOnly ? '<subscriberOnly>true</subscriberOnly>' : ''}
        `
      })),
      customData: `
        <language>en-us</language>
        <newsletter>${newsletterName}</newsletter>
        <frequency>${frequency}</frequency>
        <description>${newsletterDescription}</description>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      `,
    });
  } catch (error) {
    console.error(`Newsletter RSS Generation Error for ${context.params.newsletter}:`, error);
    return new Response('Error generating newsletter RSS feed', { status: 500 });
  }
};