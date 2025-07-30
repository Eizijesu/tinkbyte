// fix.mjs
import fs from 'fs';
import path from 'path';

function fixFile(filePath, fixes) {
  if (!fs.existsSync(filePath)) {
    
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      
      return true;
    } else {
      
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Fix TinaCMS Provider

fixFile('src/components/tina/TinaCMSProvider.astro', [
  {
    pattern: /branch:\s*"main",?\s*\n?/g,
    replacement: '',
    description: 'Removed invalid branch property'
  }
]);

// Fix ArticleCard

fixFile('src/components/blog/ArticleCard.astro', [
  {
    pattern: /onError=/g,
    replacement: 'onerror=',
    description: 'Changed onError to onerror'
  },
  {
    pattern: /container\.style\.display/g,
    replacement: '(container as HTMLElement).style.display',
    description: 'Added type assertion for container.style'
  }
]);

// Fix RelatedPosts

fixFile('src/components/blog/RelatedPosts.astro', [
  {
    pattern: /entry\.target\.style\./g,
    replacement: '(entry.target as HTMLElement).style.',
    description: 'Added type assertion for entry.target.style'
  },
  {
    pattern: /wrapper\.style\./g,
    replacement: '(wrapper as HTMLElement).style.',
    description: 'Added type assertion for wrapper.style'
  }
]);





