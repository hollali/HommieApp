// Script to patch Expo for Windows node:sea issue
const fs = require('fs');
const path = require('path');

const possiblePaths = [
  path.join('node_modules', 'expo', 'node_modules', '@expo', 'cli', 'src', 'start', 'server', 'metro', 'externals.ts'),
  path.join('node_modules', '@expo', 'cli', 'src', 'start', 'server', 'metro', 'externals.ts'),
];

let patched = false;

for (const filePath of possiblePaths) {
  if (fs.existsSync(filePath)) {
    console.log(`Found file: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Create backup
    fs.writeFileSync(`${filePath}.backup`, content);
    console.log(`Backup created: ${filePath}.backup`);
    
    // Replace node:sea with node_sea
    const originalContent = content;
    content = content.replace(/'node:sea'/g, "'node_sea'");
    content = content.replace(/`node:sea`/g, "`node_sea`");
    content = content.replace(/node:sea/g, 'node_sea');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Patched ${filePath}`);
      console.log('Replaced "node:sea" with "node_sea"');
      patched = true;
    } else {
      console.log('No changes needed in this file');
    }
    break;
  }
}

if (!patched) {
  console.log('Could not find externals.ts file to patch.');
  console.log('Trying alternative approach...');
  
  // Alternative: Try to find in node_modules/expo
  const expoPath = path.join('node_modules', 'expo');
  if (fs.existsSync(expoPath)) {
    console.log('Expo found. The file might be in a different location.');
    console.log('You may need to use tunnel mode or WSL instead.');
  }
}

console.log('\nNext steps:');
console.log('1. Try running: npm run start:tunnel');
console.log('2. Or use WSL if available');
console.log('3. Or wait for Expo to fix this in an update');

