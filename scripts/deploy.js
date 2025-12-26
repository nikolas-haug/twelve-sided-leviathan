const fs = require('fs-extra');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../build');
const DEPLOY_DIR = path.join(__dirname, '../docs'); // GitHub Pages can serve from /docs

console.log('Deploying build to docs/ for GitHub Pages...');

// Ensure docs directory exists
fs.ensureDirSync(DEPLOY_DIR);

// Copy everything from build to docs
if (fs.existsSync(BUILD_DIR)) {
  fs.emptyDirSync(DEPLOY_DIR);
  fs.copySync(BUILD_DIR, DEPLOY_DIR);
  console.log('✓ Deployed to docs/ directory');
  console.log('  GitHub Pages will serve from /docs automatically');
} else {
  console.error('✗ Build directory not found. Run "npm run build:all" first.');
  process.exit(1);
}

