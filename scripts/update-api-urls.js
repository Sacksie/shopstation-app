#!/usr/bin/env node

/**
 * Script to update all hardcoded API URLs in React components
 * to use the new environment configuration system
 */

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../frontend/src/components');

// Files to update
const filesToUpdate = [
  'DataDeletionRequest.js',
  'GroceryAdminPanel.js', 
  'ShoppingListAnalyzer.js',
  'ImprovedAdminPanel.js',
  'ComprehensiveAdminPanel.js',
  'CookieConsent.js',
  'AdminPanel_Fixed.js',
  'ReceiptUpload.js',
  'AnalyticsPage.js'
];

console.log('🔄 Updating API URLs in React components...');

filesToUpdate.forEach(filename => {
  const filePath = path.join(componentsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file needs updating
    if (!content.includes("process.env.REACT_APP_API_URL || 'https://")) {
      console.log(`⏭️  Skipping ${filename} - already updated or doesn't match pattern`);
      return;
    }
    
    // Pattern 1: Standard import and API_URL constant
    const pattern1 = /^(import React[^;]+;)\n\nconst API_URL = process\.env\.REACT_APP_API_URL \|\| '[^']+';/m;
    if (pattern1.test(content)) {
      content = content.replace(pattern1, 
        `$1\nimport config from '../config/environments';\n\nconst API_URL = config.api.baseUrl;`
      );
    }
    
    // Pattern 2: Inline API_URL usage in components
    const pattern2 = /const API_URL = process\.env\.REACT_APP_API_URL \|\| '[^']+';/g;
    content = content.replace(pattern2, 'const API_URL = config.api.baseUrl;');
    
    // Add import if not already present and we made changes
    if (!content.includes("import config from '../config/environments'") && content.includes('config.api.baseUrl')) {
      const importMatch = content.match(/^(import React[^;]+;)/m);
      if (importMatch) {
        content = content.replace(importMatch[0], 
          `${importMatch[0]}\nimport config from '../config/environments';`
        );
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filename}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${filename}:`, error.message);
  }
});

console.log('🎉 API URL updates completed!');