// scripts/create-categories.js
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const categories = [
  // Core Themes (6)
  { 
    slug: 'build-thinking', 
    name: 'Build Thinking', 
    description: 'Mental models, product intuition, systems mindset', 
    audience: 'Builders, designers, engineers',
    icon: 'hammer', 
    color: 'blue', 
    featured: true, 
    sortOrder: 1,
    categoryGroup: 'core',
    tags: ['mindset', 'thinking', 'frameworks']
  },
  { 
    slug: 'learning-by-doing', 
    name: 'Learning by Doing', 
    description: 'Practical experiments, hands-on growth', 
    audience: 'Self-learners, teams, tinkerers',
    icon: 'book', 
    color: 'purple', 
    featured: true, 
    sortOrder: 2,
    categoryGroup: 'core',
    tags: ['learning', 'experiments', 'hands-on']
  },
  { 
    slug: 'fail-iterate-ship', 
    name: 'Fail / Iterate / Ship', 
    description: 'Process-focused iteration and reflection', 
    audience: 'Product teams, early founders',
    icon: 'repeat', 
    color: 'orange', 
    featured: true, 
    sortOrder: 3,
    categoryGroup: 'core',
    tags: ['iteration', 'failure', 'shipping']
  },
  { 
    slug: 'product-lessons', 
    name: 'Product Lessons', 
    description: 'Real build stories, what worked/didn\'t', 
    audience: 'Startup builders, PMs',
    icon: 'lightbulb', 
    color: 'green', 
    featured: true, 
    sortOrder: 4,
    categoryGroup: 'core',
    tags: ['lessons', 'stories', 'experience']
  },
  { 
    slug: 'startup-insight', 
    name: 'Startup Insight', 
    description: 'Early-stage execution, traction, team dynamics', 
    audience: 'Founders, VCs, indie hackers',
    icon: 'rocket', 
    color: 'red', 
    featured: true, 
    sortOrder: 5,
    categoryGroup: 'core',
    tags: ['startup', 'execution', 'early-stage']
  },
  { 
    slug: 'product-strategy', 
    name: 'Product Strategy', 
    description: 'Positioning, roadmap thinking, growth decisions', 
    audience: 'PMs, product leaders, strategists',
    icon: 'target', 
    color: 'indigo', 
    featured: true, 
    sortOrder: 6,
    categoryGroup: 'core',
    tags: ['strategy', 'roadmap', 'growth']
  },
  
  // Specialized Themes (8)
  { 
    slug: 'ai-evolution', 
    name: 'AI Evolution', 
    description: 'Practical AI implementation, ethical considerations', 
    audience: 'Developers, researchers, founders',
    icon: 'brain', 
    color: 'violet', 
    featured: true, 
    sortOrder: 7,
    categoryGroup: 'specialized',
    tags: ['ai', 'machine-learning', 'ethics']
  },
  { 
    slug: 'developer-stack-tools', 
    name: 'Developer Stack & Tools', 
    description: 'Tooling, platforms, workflows, engineering stacks', 
    audience: 'Devs, technical founders, ops leads',
    icon: 'tools', 
    color: 'emerald', 
    featured: false, 
    sortOrder: 8,
    categoryGroup: 'specialized',
    tags: ['developer', 'tools', 'stack']
  },
  { 
    slug: 'research-bites', 
    name: 'Research Bites', 
    description: 'Insights from data, behavior, experiments + pattern spotting', 
    audience: 'Analysts, PMs, UX teams',
    icon: 'chart-line', 
    color: 'pink', 
    featured: false, 
    sortOrder: 9,
    categoryGroup: 'specialized',
    tags: ['research', 'data', 'insights']
  },
  { 
    slug: 'system-thinking', 
    name: 'System Thinking', 
    description: 'Logic frameworks, mental models, automation design', 
    audience: 'Architects, systems thinkers',
    icon: 'sitemap', 
    color: 'emerald', 
    featured: false, 
    sortOrder: 10,
    categoryGroup: 'specialized',
    tags: ['systems', 'frameworks', 'automation']
  },
  { 
    slug: 'the-interface', 
    name: 'The Interface', 
    description: 'UX/UI patterns, friction reduction', 
    audience: 'Designers, product managers',
    icon: 'desktop', 
    color: 'blue', 
    featured: false, 
    sortOrder: 11,
    categoryGroup: 'specialized',
    tags: ['ux', 'ui', 'interface']
  },
  { 
    slug: 'tech-culture', 
    name: 'Tech Culture', 
    description: 'Social impact, ethics, workplace culture + team dynamics', 
    audience: 'Designers, culture analysts, team leads',
    icon: 'users-cog', 
    color: 'pink', 
    featured: false, 
    sortOrder: 12,
    categoryGroup: 'specialized',
    tags: ['culture', 'ethics', 'workplace']
  },
  { 
    slug: 'global-perspective', 
    name: 'Global Perspective', 
    description: 'Emerging regions, cross-border innovation', 
    audience: 'Builders outside Silicon Valley, global VCs',
    icon: 'globe', 
    color: 'cyan', 
    featured: false, 
    sortOrder: 13,
    categoryGroup: 'specialized',
    tags: ['global', 'emerging-markets', 'innovation']
  },
  { 
    slug: 'community-innovation', 
    name: 'Community Innovation', 
    description: 'Network effects, community-led growth', 
    audience: 'Community leads, builders, marketers',
    icon: 'users', 
    color: 'green', 
    featured: false, 
    sortOrder: 14,
    categoryGroup: 'specialized',
    tags: ['community', 'network-effects', 'growth']
  },
  
  // Extended Themes (7)
  { 
    slug: 'career-stacks', 
    name: 'Career Stacks', 
    description: 'Roles, skills, transitions, growth strategies', 
    audience: 'Students, professionals, career changers, Gen Z',
    icon: 'briefcase', 
    color: 'red', 
    featured: false, 
    sortOrder: 15,
    categoryGroup: 'extended',
    tags: ['career', 'skills', 'growth']
  },
  { 
    slug: 'future-stacks', 
    name: 'Future Stacks', 
    description: 'Emerging tech: AI, AR/VR, Quantum, Web3, Robotics, IoT', 
    audience: 'Explorers, trend-watchers, technical minds',
    icon: 'zap', 
    color: 'violet', 
    featured: false, 
    sortOrder: 16,
    categoryGroup: 'extended',
    tags: ['future-tech', 'emerging', 'innovation']
  },
  { 
    slug: 'business-models-monetization', 
    name: 'Business Models & Monetization', 
    description: 'Revenue strategies, pricing, monetization', 
    audience: 'Founders, product marketers',
    icon: 'dollar-sign', 
    color: 'indigo', 
    featured: false, 
    sortOrder: 17,
    categoryGroup: 'extended',
    tags: ['business', 'monetization', 'revenue']
  },
  { 
    slug: 'creator-economy', 
    name: 'Creator Economy', 
    description: 'Tools, trends, case studies', 
    audience: 'Indie creators, digital workers, content builders',
    icon: 'paint-brush', 
    color: 'pink', 
    featured: false, 
    sortOrder: 18,
    categoryGroup: 'extended',
    tags: ['creator', 'economy', 'tools']
  },
  { 
    slug: 'consumer-behavior-attention', 
    name: 'Consumer Behavior & Attention', 
    description: 'Audience shifts, demand patterns, psychology', 
    audience: 'Growth leads, analysts, brand teams',
    icon: 'eye', 
    color: 'cyan', 
    featured: false, 
    sortOrder: 19,
    categoryGroup: 'extended',
    tags: ['consumer', 'behavior', 'psychology']
  },
  { 
    slug: 'ecosystem-shifts-market-maps', 
    name: 'Ecosystem Shifts & Market Maps', 
    description: 'Competitive changes, sector movements, market signals', 
    audience: 'Investors, researchers, strategists',
    icon: 'map', 
    color: 'emerald', 
    featured: false, 
    sortOrder: 20,
    categoryGroup: 'extended',
    tags: ['ecosystem', 'market', 'competitive']
  },
  { 
    slug: 'people-systems', 
    name: 'People Systems', 
    description: 'Team building, communication frameworks, organizational design', 
    audience: 'Team leads, founders, managers',
    icon: 'network-wired', 
    color: 'orange', 
    featured: false, 
    sortOrder: 21,
    categoryGroup: 'extended',
    tags: ['people', 'teams', 'organization']
  },

  // Legacy Aliases (for backward compatibility)
  { 
    slug: 'build-loop', 
    name: 'Build Loop', 
    description: 'Process-focused iteration and reflection (alias for Fail/Iterate/Ship)', 
    audience: 'Product teams, early founders',
    icon: 'repeat', 
    color: 'orange', 
    featured: false, 
    sortOrder: 22,
    categoryGroup: 'legacy',
    tags: ['iteration', 'failure', 'shipping'],
    isAlias: true,
    aliasFor: 'fail-iterate-ship'
  },
  { 
    slug: 'developer-tools', 
    name: 'Developer Tools', 
    description: 'Tooling and infrastructure (alias for Developer Stack & Tools)', 
    audience: 'Devs, technical founders, ops leads',
    icon: 'tools', 
    color: 'emerald', 
    featured: false, 
    sortOrder: 23,
    categoryGroup: 'legacy',
    tags: ['developer', 'tools', 'stack'],
    isAlias: true,
    aliasFor: 'developer-stack-tools'
  },
  { 
    slug: 'research-backed', 
    name: 'Research Backed', 
    description: 'Data-driven insights (alias for Research Bites)', 
    audience: 'Analysts, PMs, UX teams',
    icon: 'chart-line', 
    color: 'pink', 
    featured: false, 
    sortOrder: 24,
    categoryGroup: 'legacy',
    tags: ['research', 'data', 'insights'],
    isAlias: true,
    aliasFor: 'research-bites'
  },
  { 
    slug: 'business-models', 
    name: 'Business Models', 
    description: 'Revenue strategies (alias for Business Models & Monetization)', 
    audience: 'Founders, product marketers',
    icon: 'dollar-sign', 
    color: 'indigo', 
    featured: false, 
    sortOrder: 25,
    categoryGroup: 'legacy',
    tags: ['business', 'monetization', 'revenue'],
    isAlias: true,
    aliasFor: 'business-models-monetization'
  },
  { 
    slug: 'consumer-behavior', 
    name: 'Consumer Behavior', 
    description: 'Audience insights (alias for Consumer Behavior & Attention)', 
    audience: 'Growth leads, analysts, brand teams',
    icon: 'eye', 
    color: 'cyan', 
    featured: false, 
    sortOrder: 26,
    categoryGroup: 'legacy',
    tags: ['consumer', 'behavior', 'psychology'],
    isAlias: true,
    aliasFor: 'consumer-behavior-attention'
  },
  { 
    slug: 'market-maps', 
    name: 'Market Maps', 
    description: 'Market analysis (alias for Ecosystem Shifts & Market Maps)', 
    audience: 'Investors, researchers, strategists',
    icon: 'map', 
    color: 'emerald', 
    featured: false, 
    sortOrder: 27,
    categoryGroup: 'legacy',
    tags: ['ecosystem', 'market', 'competitive'],
    isAlias: true,
    aliasFor: 'ecosystem-shifts-market-maps'
  }
];

const categoriesDir = 'src/content/categories';

// Ensure directory exists
if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true });
}


// Enhanced content generation with better SEO and structured data
function generateCategoryContent(category) {
  const aliasNote = category.isAlias ? 
    `\n\n> **Note:** This is a legacy alias for [${category.aliasFor}](/blog/categories/${category.aliasFor}). New content should use the main category.` : '';
  
  const relatedCategories = categories
    .filter(c => c.categoryGroup === category.categoryGroup && c.slug !== category.slug && !c.isAlias)
    .slice(0, 3)
    .map(c => `- [${c.name}](/blog/categories/${c.slug})`)
    .join('\n');

  return `---
name: "${category.name}"
slug: "${category.slug}"
description: "${category.description}"
audience: "${category.audience}"
icon: "${category.icon}"
color: "${category.color}"
featured: ${category.featured}
sortOrder: ${category.sortOrder}
categoryGroup: "${category.categoryGroup}"
tags: ${JSON.stringify(category.tags)}
${category.isAlias ? `isAlias: true\naliasFor: "${category.aliasFor}"` : ''}
seo:
  title: "${category.name} Articles & Insights | TinkByte"
  description: "${category.description} Practical insights, real stories, and actionable advice for ${category.audience.toLowerCase()}."
  canonical: "https://tinkbyte.com/blog/categories/${category.slug}"
---

# ${category.name}

${category.description}

## Who This Is For

**Target Audience:** ${category.audience}

Our ${category.name.toLowerCase()} content is crafted for professionals who value substance over hype and prefer practical insights they can actually use.

## What You'll Discover

- Real-world case studies and lessons learned
- Practical frameworks and mental models
- Tools and techniques that actually work
- Stories from the trenches of building products
- Analysis that cuts through the noise${aliasNote}

## Content Philosophy

We believe in:
- **Substance over hype** - No buzzwords, just practical insights
- **Real stories** - Actual experiences from builders and makers
- **Actionable content** - Information you can apply immediately
- **Global perspective** - Learning from innovators worldwide

## Key Topics

${category.tags.map(tag => `- **${tag.charAt(0).toUpperCase() + tag.slice(1).replace('-', ' ')}** - Practical applications and insights`).join('\n')}

${relatedCategories.length > 0 ? `## Related Categories\n\n${relatedCategories}` : ''}

## Stay Updated

Subscribe to our [${category.categoryGroup === 'core' ? 'TinkByte Weekly' : category.categoryGroup === 'specialized' ? 'Build Sheet' : 'The Real Build'}](/newsletters) to get the latest ${category.name.toLowerCase()} insights delivered to your inbox.
`;
}

// Create category files
categories.forEach(category => {
  const content = generateCategoryContent(category);
  const filePath = path.join(categoriesDir, `${category.slug}.md`);
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created: ${category.slug}.md`);
  } else {
    console.log(`ℹ️  Already exists: ${category.slug}.md`);
  }
});

// Sync to database
async function syncCategoriesToDatabase() {
  console.log('\n🔄 Syncing categories to database...');
  
  for (const category of categories) {
    try {
      const { error } = await supabase
        .from('categories')
        .upsert({
          name: category.name,
          slug: category.slug,
          description: category.description,
          target_audience: category.audience,
          color: category.color,
          icon: category.icon,
          is_premium: false,
          sort_order: category.sortOrder,
          is_featured: category.featured,
          tags: category.tags,
          seo_title: `${category.name} Articles & Insights | TinkByte`,
          seo_description: `${category.description} Practical insights for ${category.audience.toLowerCase()}.`,
          newsletter_enabled: false,
          created_at: new Date().toISOString()
        }, { onConflict: 'slug' });

      if (error) {
        console.error(`❌ Error syncing ${category.slug}:`, error.message);
      } else {
        console.log(`✅ Synced to DB: ${category.slug}`);
      }
    } catch (error) {
      console.error(`❌ Database error for ${category.slug}:`, error.message);
    }
  }
}

// Run the sync
await syncCategoriesToDatabase();

console.log(`\n🎉 Processed ${categories.length} category files!`);
console.log(`📊 Breakdown:`);
console.log(`   • Core themes: ${categories.filter(c => c.categoryGroup === 'core').length}`);
console.log(`   • Specialized themes: ${categories.filter(c => c.categoryGroup === 'specialized').length}`);
console.log(`   • Extended themes: ${categories.filter(c => c.categoryGroup === 'extended').length}`);
console.log(`   • Legacy aliases: ${categories.filter(c => c.categoryGroup === 'legacy').length}`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Categories synced to database ✅`);
console.log(`   2. Check your TinaCMS admin at /admin`);
console.log(`   3. Run: npm run build`);