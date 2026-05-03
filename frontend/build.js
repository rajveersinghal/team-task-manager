// Simple build script: copy frontend files to dist/ without bundling
const fs = require('fs');
const path = require('path');

const src = __dirname;
const dist = path.join(__dirname, 'dist');

// Create dist directory
if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true });

// Copy files
['index.html', 'main.js', 'style.css'].forEach(file => {
  fs.copyFileSync(path.join(src, file), path.join(dist, file));
  console.log(`Copied ${file} -> dist/${file}`);
});

console.log('Build complete!');
