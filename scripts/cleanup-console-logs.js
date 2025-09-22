#!/usr/bin/env node

/**
 * Console Log Cleanup Script
 * 
 * Removes console.log statements from production code while preserving
 * console.error and console.warn for debugging purposes.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting Console Log Cleanup...\n');

// Files to clean up (excluding backup files)
const filesToClean = [
  'components/editor/components/BlockEdit.tsx',
  'components/editor/components/WordPressBlockEditor.tsx',
  'components/editor/hooks/useWordPressComponents.ts',
  'components/ArticleGenerator.tsx',
  'components/editor/ClientOnlyGutenbergEditor.tsx',
  'components/editor/SmartGutenbergEditor.tsx',
  'components/SiteSelector.tsx',
  'components/editor/hooks/useBlockManagement.ts',
  'components/editor/hooks/useImageSearch.ts',
  'components/ImageToolbar.tsx'
];

let totalRemoved = 0;

filesToClean.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const originalLines = content.split('\n').length;
  
  // Remove console.log statements but keep console.error and console.warn
  const cleanedContent = content
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      // Keep console.error and console.warn, remove console.log
      if (trimmed.includes('console.log')) {
        totalRemoved++;
        return false;
      }
      return true;
    })
    .join('\n');

  const newLines = cleanedContent.split('\n').length;
  const removedLines = originalLines - newLines;

  if (removedLines > 0) {
    fs.writeFileSync(filePath, cleanedContent);
    console.log(`✅ Cleaned ${removedLines} console.log statements from ${filePath}`);
  } else {
    console.log(`ℹ️  No console.log statements found in ${filePath}`);
  }
});

console.log(`\n🎉 Console log cleanup complete!`);
console.log(`📊 Total console.log statements removed: ${totalRemoved}`);
console.log(`\n💡 Note: console.error and console.warn statements were preserved for debugging.`);
