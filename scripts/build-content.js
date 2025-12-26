const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const matter = require('front-matter');
const chokidar = require('chokidar');

const CONTENT_DIR = path.join(__dirname, '../content');
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const BUILD_DIR = path.join(__dirname, '../build');
const ASSETS_DIR = path.join(__dirname, '../assets');

// Ensure build directory exists
fs.ensureDirSync(BUILD_DIR);
fs.ensureDirSync(path.join(BUILD_DIR, 'posts'));
fs.ensureDirSync(path.join(BUILD_DIR, 'pages'));
fs.ensureDirSync(path.join(BUILD_DIR, 'assets'));

// Copy assets to build directory
function copyAssets() {
  if (fs.existsSync(ASSETS_DIR)) {
    fs.copySync(ASSETS_DIR, path.join(BUILD_DIR, 'assets'));
  }
  
  // Copy dist (CSS) to build
  const distDir = path.join(__dirname, '../dist');
  if (fs.existsSync(distDir)) {
    fs.copySync(distDir, path.join(BUILD_DIR, 'dist'));
  }
  
  // Copy js to build
  const jsDir = path.join(__dirname, '../js');
  if (fs.existsSync(jsDir)) {
    fs.copySync(jsDir, path.join(BUILD_DIR, 'js'));
  }
  
  // Copy prism files if they exist
  const prismCss = path.join(__dirname, '../prism.css');
  const prismJs = path.join(__dirname, '../prism.js');
  if (fs.existsSync(prismCss)) {
    fs.copySync(prismCss, path.join(BUILD_DIR, 'prism.css'));
  }
  if (fs.existsSync(prismJs)) {
    fs.copySync(prismJs, path.join(BUILD_DIR, 'prism.js'));
  }
}

// Read template file
function readTemplate(templateName) {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8');
  }
  throw new Error(`Template ${templateName} not found`);
}

// Read partial file
function readPartial(partialName) {
  const partialPath = path.join(TEMPLATES_DIR, 'partials', `${partialName}.html`);
  if (fs.existsSync(partialPath)) {
    return fs.readFileSync(partialPath, 'utf8');
  }
  throw new Error(`Partial ${partialName} not found`);
}

// Process markdown file
function processMarkdown(filePath, type) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(content);
  const html = marked(parsed.body);
  
  return {
    frontmatter: parsed.attributes,
    content: html,
    slug: path.basename(filePath, '.md')
  };
}

// Generate HTML from template
function generateHTML(template, data) {
  let html = template;
  
  // Process partials first ({{> partial-name}} syntax)
  const partialRegex = /\{\{>\s*([\w-]+)\s*\}\}/g;
  html = html.replace(partialRegex, (match, partialName) => {
    try {
      const partialContent = readPartial(partialName);
      // Recursively process partials (so partials can include other partials)
      return generateHTML(partialContent, data);
    } catch (e) {
      console.warn(`Warning: Partial "${partialName}" not found`);
      return '';
    }
  });
  
  // Handle conditional blocks (simple {{#key}}...{{/key}} syntax)
  // Remove blocks if key is falsy
  Object.keys(data).forEach(key => {
    const blockRegex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
    if (data[key]) {
      html = html.replace(blockRegex, (match, content) => content);
    } else {
      html = html.replace(blockRegex, '');
    }
  });
  
  // Replace template variables
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, data[key] || '');
  });
  
  return html;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Process all posts
function processPosts() {
  const postsDir = path.join(CONTENT_DIR, 'posts');
  if (!fs.existsSync(postsDir)) {
    return [];
  }
  
  const files = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse(); // Newest first
  
  const posts = files.map(file => {
    const filePath = path.join(postsDir, file);
    return processMarkdown(filePath, 'post');
  });
  
  return posts;
}

// Process all pages
function processPages() {
  const pagesDir = path.join(CONTENT_DIR, 'pages');
  if (!fs.existsSync(pagesDir)) {
    return [];
  }
  
  const files = fs.readdirSync(pagesDir)
    .filter(file => file.endsWith('.md'));
  
  const pages = files.map(file => {
    const filePath = path.join(pagesDir, file);
    return processMarkdown(filePath, 'page');
  });
  
  return pages;
}

// Build all content
function buildAll() {
  console.log('Building content...');
  
  copyAssets();
  
  const posts = processPosts();
  const pages = processPages();
  
  // Build individual post pages
  const postTemplate = readTemplate('post');
  posts.forEach(post => {
    const postData = {
      title: post.frontmatter.title || 'Untitled',
      date: post.frontmatter.date ? formatDate(post.frontmatter.date) : '',
      author: post.frontmatter.author || '',
      content: post.content,
      siteTitle: 'Twelve-Sided Leviathan',
      baseUrl: '../' // Posts are in posts/ subdirectory
    };
    
    const html = generateHTML(postTemplate, postData);
    const outputPath = path.join(BUILD_DIR, 'posts', `${post.slug}.html`);
    fs.writeFileSync(outputPath, html);
  });
  
  // Build individual page pages
  const pageTemplate = readTemplate('page');
  pages.forEach(page => {
    let pageContent = page.content;
    
    // Auto-generate archive page if it's the archive page
    if (page.slug === 'archive') {
      const archiveList = posts.map(post => {
        const date = post.frontmatter.date ? formatDate(post.frontmatter.date) : '';
        return `<li><a href="../posts/${post.slug}.html">${post.frontmatter.title || 'Untitled'}</a>${date ? ` - ${date}` : ''}</li>`;
      }).join('\n');
      pageContent = `<p>This page lists all blog posts in chronological order.</p><h2>2025</h2><ul>${archiveList}</ul><p><em>More posts coming soon!</em></p>`;
    }
    
    const pageData = {
      title: page.frontmatter.title || 'Untitled',
      content: pageContent,
      siteTitle: 'Twelve-Sided Leviathan',
      baseUrl: '../' // Pages are in pages/ subdirectory
    };
    
    const html = generateHTML(pageTemplate, pageData);
    const outputPath = path.join(BUILD_DIR, 'pages', `${page.slug}.html`);
    fs.writeFileSync(outputPath, html);
  });
  
  // Build index page
  const indexTemplate = readTemplate('index');
  const postList = posts.length > 0 ? posts.map(post => {
    const date = post.frontmatter.date ? formatDate(post.frontmatter.date) : '';
    return `
      <article class="post-preview">
        <h2><a href="posts/${post.slug}.html">${post.frontmatter.title || 'Untitled'}</a></h2>
        ${date ? `<p class="post-meta">${date}${post.frontmatter.author ? ` by ${post.frontmatter.author}` : ''}</p>` : ''}
        ${post.frontmatter.excerpt ? `<p class="post-excerpt">${post.frontmatter.excerpt}</p>` : ''}
      </article>
    `;
  }).join('\n') : '<p>No posts yet. Check back soon!</p>';
  
  const indexData = {
    title: 'Twelve-Sided Leviathan',
    content: postList,
    siteTitle: 'Twelve-Sided Leviathan',
    baseUrl: '' // Index is in root
  };
  
  const indexHTML = generateHTML(indexTemplate, indexData);
  fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), indexHTML);
  
  console.log(`Built ${posts.length} posts, ${pages.length} pages, and index page`);
}

// Watch mode
function watch() {
  console.log('Watching for changes...');
  
  const watcher = chokidar.watch([
    path.join(CONTENT_DIR, '**/*.md'),
    path.join(TEMPLATES_DIR, '**/*.html'),
    path.join(ASSETS_DIR, '**/*')
  ], {
    ignored: /node_modules/,
    persistent: true
  });
  
  watcher.on('change', (filePath) => {
    console.log(`File changed: ${filePath}`);
    buildAll();
  });
  
  watcher.on('add', (filePath) => {
    console.log(`File added: ${filePath}`);
    buildAll();
  });
  
  buildAll();
}

// Main
const args = process.argv.slice(2);
if (args.includes('--watch')) {
  watch();
} else {
  buildAll();
}

