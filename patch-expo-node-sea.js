// Patch script to intercept and fix node:sea directory creation
// This uses a postinstall hook approach

const fs = require('fs');
const path = require('path');

// Find the actual running code location
const findExpoExternals = () => {
  const possiblePaths = [
    path.join(__dirname, 'node_modules', 'expo', 'node_modules', '@expo', 'cli', 'src', 'start', 'server', 'metro', 'externals.ts'),
    path.join(__dirname, 'node_modules', '@expo', 'cli', 'src', 'start', 'server', 'metro', 'externals.ts'),
    path.join(__dirname, 'node_modules', 'expo', 'node_modules', '@expo', 'cli', 'dist', 'start', 'server', 'metro', 'externals.js'),
  ];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
};

const patchFile = (filePath) => {
  console.log(`Found file: ${filePath}`);
  
  // Create backup
  const backupPath = `${filePath}.backup`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`Backup created: ${backupPath}`);
  }
  
  // Read file
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Replace all occurrences of 'node:sea' with 'node_sea'
  content = content.replace(/'node:sea'/g, "'node_sea'");
  content = content.replace(/"node:sea"/g, '"node_sea"');
  content = content.replace(/`node:sea`/g, '`node_sea`');
  content = content.replace(/node:sea/g, 'node_sea');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✓ Patched file successfully');
    console.log('Replaced "node:sea" with "node_sea"');
    return true;
  } else {
    console.log('No changes needed (already patched?)');
    return false;
  }
};

// Main execution
const filePath = findExpoExternals();
if (filePath) {
  patchFile(filePath);
} else {
  console.log('Could not find externals file to patch.');
  console.log('');
  console.log('The file might be bundled. Trying alternative workaround...');
  console.log('');
  
  // Alternative: Create the directory structure that Expo expects
  const externalsDir = path.join(__dirname, '.expo', 'metro', 'externals');
  const safeDir = path.join(externalsDir, 'node_sea');
  
  try {
    if (!fs.existsSync(externalsDir)) {
      fs.mkdirSync(externalsDir, { recursive: true });
    }
    if (!fs.existsSync(safeDir)) {
      fs.mkdirSync(safeDir, { recursive: true });
    }
    console.log(`Created directory: ${safeDir}`);
    console.log('');
    console.log('NOTE: You still need to patch the Expo source code.');
    console.log('The best solution is to downgrade Node.js to v20.x LTS.');
    console.log('Download from: https://nodejs.org/');
  } catch (err) {
    console.error('Error creating directory:', err.message);
  }
}
