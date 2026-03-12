// Workaround script to prevent node:sea directory creation
const fs = require('fs');
const path = require('path');

// Create the externals directory with a different name
const externalsDir = path.join(__dirname, '.expo', 'metro', 'externals');

// Ensure parent directory exists
const parentDir = path.dirname(externalsDir);
if (!fs.existsSync(parentDir)) {
  fs.mkdirSync(parentDir, { recursive: true });
}

// Try to create a workaround by making a file instead of directory
// This won't work but might prevent the error from crashing
try {
  if (!fs.existsSync(externalsDir)) {
    fs.mkdirSync(externalsDir, { recursive: true });
  }
  console.log('Created externals directory');
} catch (err) {
  console.error('Could not create directory:', err.message);
}

