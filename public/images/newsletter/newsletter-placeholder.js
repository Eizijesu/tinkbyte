// Create a simple script to generate placeholder images
// Save this as generate-placeholders.js and run with Node.js

const fs = require('fs');
const path = require('path');

const newsletters = [
  { code: 'twr', name: 'Tinkbyte Weekly', color: '#3B82F6' },
  { code: 'tbs', name: 'Build Sheet', color: '#8B5CF6' },
  { code: 'ts', name: 'Stackdown', color: '#10B981' },
  { code: 'tsd', name: 'Signal Drop', color: '#F59E0B' },
  { code: 'tss', name: 'System Signal', color: '#EF4444' },
  { code: 'trb', name: 'The Real Build', color: '#6366F1' },
  { code: 'ttl', name: 'The Loop', color: '#EC4899' },
  { code: 'tds', name: 'Data Slice', color: '#14B8A6' },
  { code: 'ttm', name: 'The Mirror', color: '#F97316' },
  { code: 'tch', name: 'Community Code', color: '#84CC16' },
  { code: 'tft', name: 'Future Tech', color: '#06B6D4' }
];

newsletters.forEach(newsletter => {
  const svg = `<svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="80" fill="${newsletter.color}"/>
    <text x="60" y="35" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${newsletter.code}</text>
    <text x="60" y="55" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8">${newsletter.name}</text>
  </svg>`;
  
  fs.writeFileSync(`public/images/newsletter/${newsletter.code.toLowerCase()}.svg`, svg);
});