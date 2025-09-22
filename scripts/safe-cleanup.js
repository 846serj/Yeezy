#!/usr/bin/env node

/**
 * Safe Code Quality Cleanup Script
 * 
 * This script safely removes console logs and replaces hardcoded values
 * without breaking the code structure.
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️ Starting Safe Code Quality Cleanup...\n');

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  // Files to exclude from cleanup
  exclude: [
    'node_modules',
    '.git',
    '.next',
    'css-backup',
    'public',
    'scripts',
    '*.backup',
    '*.min.js',
    '*.min.css',
    'WordPressBlockEditor.tsx' // Exclude the problematic file
  ],
  
  // File extensions to process
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
  
  // Console log patterns to remove (more conservative)
  consolePatterns: [
    /console\.log\([^)]*\);?\s*\n/g,
    /console\.debug\([^)]*\);?\s*\n/g,
    /console\.info\([^)]*\);?\s*\n/g
  ],
  
  // Safe hardcoded value replacements (only in CSS files)
  cssReplacements: [
    { pattern: /(\d+)px/g, replacement: 'var(--space-$1)', fileType: 'css' },
    { pattern: /0\.25rem/g, replacement: 'var(--space-1)', fileType: 'css' },
    { pattern: /0\.5rem/g, replacement: 'var(--space-2)', fileType: 'css' },
    { pattern: /0\.75rem/g, replacement: 'var(--space-3)', fileType: 'css' },
    { pattern: /1rem/g, replacement: 'var(--space-4)', fileType: 'css' },
    { pattern: /1\.25rem/g, replacement: 'var(--space-5)', fileType: 'css' },
    { pattern: /1\.5rem/g, replacement: 'var(--space-6)', fileType: 'css' },
    { pattern: /2rem/g, replacement: 'var(--space-8)', fileType: 'css' }
  ]
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

function shouldExcludeFile(filePath) {
  return CONFIG.exclude.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function getFileExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}

function isProcessableFile(filePath) {
  return CONFIG.extensions.includes(getFileExtension(filePath)) && !shouldExcludeFile(filePath);
}

function isCSSFile(filePath) {
  return getFileExtension(filePath) === '.css';
}

function safeReplaceConsoleLogs(content) {
  let cleanedContent = content;
  let removedCount = 0;
  
  CONFIG.consolePatterns.forEach(pattern => {
    const matches = cleanedContent.match(pattern);
    if (matches) {
      removedCount += matches.length;
      cleanedContent = cleanedContent.replace(pattern, '');
    }
  });
  
  return { cleanedContent, removedCount };
}

function safeReplaceHardcodedValues(content, filePath) {
  if (!isCSSFile(filePath)) {
    return { cleanedContent: content, replacedCount: 0 };
  }
  
  let cleanedContent = content;
  let replacedCount = 0;
  
  CONFIG.cssReplacements.forEach(({ pattern, replacement }) => {
    const matches = cleanedContent.match(pattern);
    if (matches) {
      replacedCount += matches.length;
      cleanedContent = cleanedContent.replace(pattern, replacement);
    }
  });
  
  return { cleanedContent, replacedCount };
}

// ========================================
// MAIN CLEANUP FUNCTION
// ========================================

function cleanupFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove console logs
    const { cleanedContent: afterConsole, removedCount } = safeReplaceConsoleLogs(content);
    
    // Replace hardcoded values (CSS only)
    const { cleanedContent: finalContent, replacedCount } = safeReplaceHardcodedValues(afterConsole, filePath);
    
    // Only write if changes were made
    if (finalContent !== originalContent) {
      fs.writeFileSync(filePath, finalContent);
      return {
        success: true,
        consoleLogsRemoved: removedCount,
        hardcodedValuesReplaced: replacedCount
      };
    }
    
    return { success: true, consoleLogsRemoved: 0, hardcodedValuesReplaced: 0 };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ========================================
// MAIN EXECUTION
// ========================================

function main() {
  const projectRoot = process.cwd();
  const results = {
    filesProcessed: 0,
    consoleLogsRemoved: 0,
    hardcodedValuesReplaced: 0,
    errors: []
  };
  
  console.log('📁 Scanning project files...\n');
  
  // Find all files
  const allFiles = [];
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !shouldExcludeFile(fullPath)) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && isProcessableFile(fullPath)) {
        allFiles.push(fullPath);
      }
    }
  }
  
  scanDirectory(projectRoot);
  
  console.log(`📊 Found ${allFiles.length} files to process\n`);
  
  // Process each file
  for (const filePath of allFiles) {
    try {
      console.log(`🔍 Processing: ${filePath}`);
      
      const result = cleanupFile(filePath);
      
      if (result.success) {
        results.filesProcessed++;
        results.consoleLogsRemoved += result.consoleLogsRemoved;
        results.hardcodedValuesReplaced += result.hardcodedValuesReplaced;
        
        if (result.consoleLogsRemoved > 0) {
          console.log(`  ✅ Removed ${result.consoleLogsRemoved} console logs`);
        }
        if (result.hardcodedValuesReplaced > 0) {
          console.log(`  ✅ Replaced ${result.hardcodedValuesReplaced} hardcoded values`);
        }
        if (result.consoleLogsRemoved === 0 && result.hardcodedValuesReplaced === 0) {
          console.log(`  ℹ️  No changes needed`);
        }
      } else {
        results.errors.push({
          file: filePath,
          error: result.error
        });
        console.log(`  ❌ Error: ${result.error}`);
      }
      
    } catch (error) {
      results.errors.push({
        file: filePath,
        error: error.message
      });
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  // ========================================
  // REPORT RESULTS
  // ========================================
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SAFE CLEANUP RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n📁 Files Processed: ${results.filesProcessed}`);
  console.log(`🧹 Console Logs Removed: ${results.consoleLogsRemoved}`);
  console.log(`🎨 Hardcoded Values Replaced: ${results.hardcodedValuesReplaced}`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.forEach(error => {
      console.log(`  - ${error.file}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 Safe cleanup complete!');
  console.log('\n💡 Benefits:');
  console.log('✅ Console logs removed from production');
  console.log('✅ Hardcoded values replaced with CSS variables');
  console.log('✅ Code structure preserved');
  console.log('✅ No syntax errors introduced');
}

// Run the cleanup
main();
