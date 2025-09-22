#!/usr/bin/env node

/**
 * Comprehensive Code Quality Cleanup Script
 * 
 * This script addresses all major code quality issues:
 * 1. Removes console logs
 * 2. Replaces hardcoded values with CSS variables
 * 3. Identifies TypeScript issues
 * 4. Finds duplicate files
 * 5. Identifies massive components
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Comprehensive Code Quality Cleanup...\n');

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
    '*.min.css'
  ],
  
  // File extensions to process
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
  
  // Maximum file size before flagging as "massive"
  maxFileSize: 1000, // lines
  
  // Console log patterns to remove
  consolePatterns: [
    /console\.log\([^)]*\);?/g,
    /console\.debug\([^)]*\);?/g,
    /console\.info\([^)]*\);?/g
  ],
  
  // Hardcoded value patterns to replace
  hardcodedPatterns: [
    // Pixel values
    { pattern: /(\d+)px/g, replacement: 'var(--space-$1)', type: 'spacing' },
    // Rem values (common ones)
    { pattern: /0\.25rem/g, replacement: 'var(--space-1)', type: 'spacing' },
    { pattern: /0\.5rem/g, replacement: 'var(--space-2)', type: 'spacing' },
    { pattern: /0\.75rem/g, replacement: 'var(--space-3)', type: 'spacing' },
    { pattern: /1rem/g, replacement: 'var(--space-4)', type: 'spacing' },
    { pattern: /1\.25rem/g, replacement: 'var(--space-5)', type: 'spacing' },
    { pattern: /1\.5rem/g, replacement: 'var(--space-6)', type: 'spacing' },
    { pattern: /2rem/g, replacement: 'var(--space-8)', type: 'spacing' },
    // Common colors
    { pattern: /#000000/g, replacement: 'var(--color-black)', type: 'color' },
    { pattern: /#ffffff/g, replacement: 'var(--color-white)', type: 'color' },
    { pattern: /#f0f0f0/g, replacement: 'var(--color-gray-100)', type: 'color' },
    { pattern: /#e0e0e0/g, replacement: 'var(--color-gray-200)', type: 'color' },
    { pattern: /#cccccc/g, replacement: 'var(--color-gray-300)', type: 'color' },
    { pattern: /#999999/g, replacement: 'var(--color-gray-500)', type: 'color' },
    { pattern: /#666666/g, replacement: 'var(--color-gray-600)', type: 'color' },
    { pattern: /#333333/g, replacement: 'var(--color-gray-800)', type: 'color' }
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

function countLines(content) {
  return content.split('\n').length;
}

function findConsoleLogs(content) {
  const matches = [];
  CONFIG.consolePatterns.forEach(pattern => {
    const found = content.match(pattern);
    if (found) {
      matches.push(...found);
    }
  });
  return matches;
}

function findHardcodedValues(content) {
  const matches = [];
  CONFIG.hardcodedPatterns.forEach(({ pattern, replacement, type }) => {
    const found = content.match(pattern);
    if (found) {
      matches.push({
        matches: found,
        replacement,
        type,
        pattern: pattern.toString()
      });
    }
  });
  return matches;
}

function findTypeScriptIssues(content) {
  const issues = [];
  
  // Find 'any' types
  const anyMatches = content.match(/\bany\b/g);
  if (anyMatches) {
    issues.push({
      type: 'any-types',
      count: anyMatches.length,
      message: `Found ${anyMatches.length} 'any' types`
    });
  }
  
  // Find 'unknown' types
  const unknownMatches = content.match(/\bunknown\b/g);
  if (unknownMatches) {
    issues.push({
      type: 'unknown-types',
      count: unknownMatches.length,
      message: `Found ${unknownMatches.length} 'unknown' types`
    });
  }
  
  // Find missing return types
  const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*{/g);
  if (functionMatches) {
    issues.push({
      type: 'missing-return-types',
      count: functionMatches.length,
      message: `Found ${functionMatches.length} functions without return types`
    });
  }
  
  return issues;
}

// ========================================
// MAIN CLEANUP FUNCTIONS
// ========================================

function cleanupConsoleLogs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  let cleanedContent = content;
  CONFIG.consolePatterns.forEach(pattern => {
    cleanedContent = cleanedContent.replace(pattern, '');
  });
  
  if (cleanedContent !== originalContent) {
    fs.writeFileSync(filePath, cleanedContent);
    return {
      cleaned: true,
      originalLines: countLines(originalContent),
      newLines: countLines(cleanedContent)
    };
  }
  
  return { cleaned: false };
}

function cleanupHardcodedValues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  let cleanedContent = content;
  CONFIG.hardcodedPatterns.forEach(({ pattern, replacement }) => {
    cleanedContent = cleanedContent.replace(pattern, replacement);
  });
  
  if (cleanedContent !== originalContent) {
    fs.writeFileSync(filePath, cleanedContent);
    return {
      cleaned: true,
      originalContent,
      newContent: cleanedContent
    };
  }
  
  return { cleaned: false };
}

// ========================================
// ANALYSIS FUNCTIONS
// ========================================

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = countLines(content);
  
  return {
    path: filePath,
    lines,
    isMassive: lines > CONFIG.maxFileSize,
    consoleLogs: findConsoleLogs(content),
    hardcodedValues: findHardcodedValues(content),
    typescriptIssues: findTypeScriptIssues(content)
  };
}

function findDuplicateFiles(directory) {
  const files = new Map();
  const duplicates = [];
  
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !shouldExcludeFile(fullPath)) {
        scanDir(fullPath);
      } else if (entry.isFile() && isProcessableFile(fullPath)) {
        const baseName = path.basename(fullPath, path.extname(fullPath));
        const ext = path.extname(fullPath);
        
        if (!files.has(baseName)) {
          files.set(baseName, []);
        }
        files.get(baseName).push(fullPath);
      }
    }
  }
  
  scanDir(directory);
  
  files.forEach((fileList, baseName) => {
    if (fileList.length > 1) {
      duplicates.push({
        baseName,
        files: fileList
      });
    }
  });
  
  return duplicates;
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
    massiveFiles: [],
    duplicateFiles: [],
    typescriptIssues: [],
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
      
      // Analyze file
      const analysis = analyzeFile(filePath);
      results.filesProcessed++;
      
      // Check for massive files
      if (analysis.isMassive) {
        results.massiveFiles.push({
          path: filePath,
          lines: analysis.lines
        });
      }
      
      // Clean up console logs
      const consoleCleanup = cleanupConsoleLogs(filePath);
      if (consoleCleanup.cleaned) {
        results.consoleLogsRemoved += consoleCleanup.originalLines - consoleCleanup.newLines;
        console.log(`  ✅ Removed console logs`);
      }
      
      // Clean up hardcoded values
      const hardcodedCleanup = cleanupHardcodedValues(filePath);
      if (hardcodedCleanup.cleaned) {
        results.hardcodedValuesReplaced++;
        console.log(`  ✅ Replaced hardcoded values`);
      }
      
      // Collect TypeScript issues
      if (analysis.typescriptIssues.length > 0) {
        results.typescriptIssues.push({
          file: filePath,
          issues: analysis.typescriptIssues
        });
      }
      
    } catch (error) {
      results.errors.push({
        file: filePath,
        error: error.message
      });
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  // Find duplicate files
  console.log('\n🔍 Checking for duplicate files...');
  results.duplicateFiles = findDuplicateFiles(projectRoot);
  
  // ========================================
  // REPORT RESULTS
  // ========================================
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 CLEANUP RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n📁 Files Processed: ${results.filesProcessed}`);
  console.log(`🧹 Console Logs Removed: ${results.consoleLogsRemoved}`);
  console.log(`🎨 Hardcoded Values Replaced: ${results.hardcodedValuesReplaced}`);
  
  if (results.massiveFiles.length > 0) {
    console.log(`\n⚠️  Massive Files (${results.massiveFiles.length}):`);
    results.massiveFiles.forEach(file => {
      console.log(`  - ${file.path} (${file.lines} lines)`);
    });
  }
  
  if (results.duplicateFiles.length > 0) {
    console.log(`\n🔄 Duplicate Files (${results.duplicateFiles.length}):`);
    results.duplicateFiles.forEach(dup => {
      console.log(`  - ${dup.baseName}:`);
      dup.files.forEach(file => console.log(`    ${file}`));
    });
  }
  
  if (results.typescriptIssues.length > 0) {
    console.log(`\n🔧 TypeScript Issues:`);
    results.typescriptIssues.forEach(file => {
      console.log(`  - ${file.file}:`);
      file.issues.forEach(issue => {
        console.log(`    ${issue.message}`);
      });
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.forEach(error => {
      console.log(`  - ${error.file}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 Cleanup complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Review the changes made');
  console.log('2. Test your application');
  console.log('3. Address remaining TypeScript issues');
  console.log('4. Break down massive files');
  console.log('5. Remove duplicate files');
}

// Run the cleanup
main();
