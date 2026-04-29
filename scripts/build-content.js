const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const matter = require('front-matter');
const chokidar = require('chokidar');

const CONTENT_DIR = path.join(__dirname, '../content');
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const DATA_DIR = path.join(__dirname, '../data');
const BUILD_DIR = path.join(__dirname, '../build');
const ASSETS_DIR = path.join(__dirname, '../assets');
const STATIC_DIR = path.join(__dirname, '../static');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');

// Ensure base build directories exist
fs.ensureDirSync(BUILD_DIR);
fs.ensureDirSync(path.join(BUILD_DIR, 'js'));
fs.ensureDirSync(path.join(BUILD_DIR, 'css'));
fs.ensureDirSync(path.join(BUILD_DIR, 'webfonts'));
fs.ensureDirSync(path.join(BUILD_DIR, 'images'));
fs.ensureDirSync(path.join(BUILD_DIR, 'admin'));
fs.ensureDirSync(path.join(BUILD_DIR, 'blog'));

// ============================================================
// PAGE CONFIGURATIONS
// Each entry controls how a static page is built.
//
// To add a new static page:
//   1. Create content/pages/<slug>.md
//   2. Add an entry here
//
// Blog posts are handled separately by buildPosts() below.
// ============================================================
const PAGE_CONFIGS = {

  index: {
    template: 'page',
    outputPath: 'index.html',
    baseUrl: './',
    sitemapUrl: '/',
    sitemapPriority: '1.0',
    sitemapChangefreq: 'monthly'
  },

  about: {
    template: 'page',
    outputPath: 'about/index.html',
    baseUrl: '../',
    sitemapUrl: '/about/',
    sitemapPriority: '0.7',
    sitemapChangefreq: 'yearly'
  },

  contact: {
    template: 'page',
    outputPath: 'contact/index.html',
    baseUrl: '../',
    sitemapUrl: '/contact/',
    sitemapPriority: '0.6',
    sitemapChangefreq: 'yearly'
  },

  404: {
    template: 'page',
    outputPath: '404.html',
    baseUrl: './',
    sitemapUrl: null,
    sitemapPriority: null,
    sitemapChangefreq: null
  }

};

// Copy assets to build directory
function copyAssets() {
  // Copy JS files
  const jsDir = path.join(STATIC_DIR, 'js');
  if (fs.existsSync(jsDir)) {
    fs.copySync(jsDir, path.join(BUILD_DIR, 'js'));
  }

  // Copy Font Awesome CSS
  const fontAwesomeCss = path.join(STATIC_DIR, 'css/font-awesome.css');
  if (fs.existsSync(fontAwesomeCss)) {
    fs.copySync(fontAwesomeCss, path.join(BUILD_DIR, 'css/font-awesome.css'));
  }

  // Copy Font Awesome webfonts
  const webfontsDir = path.join(STATIC_DIR, 'webfonts');
  if (fs.existsSync(webfontsDir)) {
    fs.copySync(webfontsDir, path.join(BUILD_DIR, 'webfonts'));
  }

  // Copy image assets
  const imagesDir = path.join(ASSETS_DIR, 'images');
  if (fs.existsSync(imagesDir)) {
    fs.copySync(imagesDir, path.join(BUILD_DIR, 'images'));
    console.log('Copied image assets');
  }

  // Copy llms.txt for AI discoverability
  const llmsTxt = path.join(__dirname, '../llms.txt');
  if (fs.existsSync(llmsTxt)) {
    fs.copySync(llmsTxt, path.join(BUILD_DIR, 'llms.txt'));
    console.log('Copied llms.txt');
  }

  // Copy admin folder for Sveltia CMS
  const adminDir = path.join(__dirname, '../admin');
  if (fs.existsSync(adminDir)) {
    fs.copySync(adminDir, path.join(BUILD_DIR, 'admin'));
    console.log('Copied admin folder for Sveltia CMS');
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

// Read JSON data file
function readData(dataName) {
  const dataPath = path.join(DATA_DIR, `${dataName}.json`);
  if (fs.existsSync(dataPath)) {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
  return null;
}

// Custom marked renderer: wrap images with a title in <figure>/<figcaption>
const renderer = new marked.Renderer();
renderer.image = (href, title, text) => {
  if (title) {
    return `<figure><img src="${href}" alt="${text}"><figcaption>${title}</figcaption></figure>`;
  }
  return `<img src="${href}" alt="${text}">`;
};

/**
 * Post HTML is served from /<slug>/index.html. CMS tools often emit root-absolute
 * paths like /images/foo.jpg, which resolve incorrectly on GitHub Pages project
 * sites (they hit the domain root, not the repo). Rewrite to ../images/...
 */
function normalizePostHtmlAssetPaths(html) {
  return html.replace(/\b(src|href)="\/images\//g, '$1="../images/');
}

// Process markdown file
function processMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(content);
  const html = marked(parsed.body, { renderer });

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

  // Handle conditional blocks ({{#key}}...{{/key}} syntax)
  Object.keys(data).forEach(key => {
    const blockRegex = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{\\/${key}\\}\\}`, 'g');
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

// Format date for display.
// front-matter parses bare YAML dates as UTC-midnight Date objects,
// so we read UTC parts to recover the intended calendar date before
// converting to local time for display.
function formatDate(dateString) {
  if (!dateString) return '';
  let year, month, day;
  if (dateString instanceof Date) {
    year  = dateString.getUTCFullYear();
    month = dateString.getUTCMonth() + 1;
    day   = dateString.getUTCDate();
  } else {
    [year, month, day] = String(dateString).split('-').map(Number);
  }
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Generate SEO metadata with defaults
function generateSEOMeta(page, siteData, baseUrl, fullUrl) {
  const siteUrl = siteData.siteUrl;
  const defaultImage = page.frontmatter.heroImage
    ? `${siteUrl}/${page.frontmatter.heroImage.replace(/^\//, '')}`
    : `${siteUrl}/images/favicon.png`;

  return {
    metaTitle: page.frontmatter.metaTitle || `${page.frontmatter.title} | ${siteData.siteTitle}`,
    metaDescription: page.frontmatter.metaDescription || siteData.siteDescription,
    metaKeywords: page.frontmatter.metaKeywords || siteData.metaKeywords || '',
    metaAuthor: page.frontmatter.metaAuthor || siteData.siteTitle,
    metaRobots: page.frontmatter.metaRobots || 'index, follow',
    canonicalUrl: page.frontmatter.canonicalUrl || fullUrl,

    // Open Graph
    ogType: page.frontmatter.ogType || 'website',
    ogTitle: page.frontmatter.ogTitle || page.frontmatter.metaTitle || `${page.frontmatter.title} | ${siteData.siteTitle}`,
    ogDescription: page.frontmatter.ogDescription || page.frontmatter.metaDescription || siteData.siteDescription,
    ogImage: page.frontmatter.ogImage || defaultImage,

    // Twitter
    twitterTitle: page.frontmatter.twitterTitle || page.frontmatter.ogTitle || page.frontmatter.metaTitle || `${page.frontmatter.title} | ${siteData.siteTitle}`,
    twitterDescription: page.frontmatter.twitterDescription || page.frontmatter.ogDescription || page.frontmatter.metaDescription || siteData.siteDescription,
    twitterImage: page.frontmatter.twitterImage || page.frontmatter.ogImage || defaultImage,

    // Schema.org
    schemaType: page.frontmatter.schemaType || 'WebSite'
  };
}

// Generate sitemap.xml
function generateSitemap(pages, siteUrl) {
  const currentDate = new Date().toISOString().split('T')[0];

  const urlEntries = pages.map(page => `
  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq || 'monthly'}</changefreq>
    <priority>${page.priority || '0.5'}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

// Generate sidebar HTML from siteData.sidebarWidgets
// Each widget supports:
//   title       - widget heading (required)
//   image       - path relative to site root, e.g. "images/foo.jpg"
//   imageAlt    - alt text for the image
//   text        - a single paragraph string
//   paragraphs  - array of paragraph strings (rendered in order after text)
//   links       - array of { label, url } objects rendered as a <ul>
function generateSidebarHTML(siteData, baseUrl) {
  const widgets = siteData.sidebarWidgets || [];
  if (widgets.length === 0) return '';
  return widgets.map(widget => {
    const parts = [];

    if (widget.image) {
      const src = `${baseUrl}${widget.image}`;
      const alt = widget.imageAlt || '';
      parts.push(`<img src="${src}" alt="${alt}" class="sidebar-widget__image">`);
    }

    if (widget.text) {
      parts.push(`<p>${widget.text}</p>`);
    }

    if (Array.isArray(widget.paragraphs) && widget.paragraphs.length > 0) {
      widget.paragraphs.forEach(p => parts.push(`<p>${p}</p>`));
    }

    if (Array.isArray(widget.links) && widget.links.length > 0) {
      const items = widget.links.map(link =>
        `<li><a href="${baseUrl}${link.url}">${link.label}</a></li>`
      ).join('\n            ');
      parts.push(`<ul>\n            ${items}\n        </ul>`);
    }

    return `<div class="sidebar-widget">
        <h3>${widget.title}</h3>
        ${parts.join('\n        ')}
    </div>`;
  }).join('\n    ');
}

// ============================================================
// BLOG POST BUILDER
// Reads all .md files from content/posts/, sorts by date,
// and renders each one to build/[slug]/index.html.
// Returns the sorted posts metadata for use in the blog listing.
// ============================================================
function buildPosts(siteData, generateNavHTML, generateFooterNavHTML, socialIconsHTML, schemaSameAs) {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No posts directory found, skipping post build.');
    return [];
  }

  const postFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  if (postFiles.length === 0) {
    console.log('No posts found.');
    return [];
  }

  const posts = postFiles.map(file => {
    const filePath = path.join(POSTS_DIR, file);
    return processMarkdown(filePath);
  });

  // Sort by date descending (newest first)
  posts.sort((a, b) => {
    const dateA = a.frontmatter.date ? new Date(a.frontmatter.date) : new Date(0);
    const dateB = b.frontmatter.date ? new Date(b.frontmatter.date) : new Date(0);
    return dateB - dateA;
  });

  const template = readTemplate('post');
  const baseUrl = '../';

  posts.forEach(post => {
    const slug = post.frontmatter.slug || post.slug;
    const outputDir = path.join(BUILD_DIR, slug);
    fs.ensureDirSync(outputDir);

    const sitemapUrl = `/${slug}/`;
    const canonicalUrl = `${siteData.siteUrl}${sitemapUrl}`;

    const postWithArticleDefaults = {
      ...post,
      frontmatter: {
        ...post.frontmatter,
        ogType: post.frontmatter.ogType || 'article',
        schemaType: post.frontmatter.schemaType || 'Article',
        metaDescription: post.frontmatter.metaDescription || post.frontmatter.excerpt || siteData.siteDescription
      }
    };

    const seoMeta = generateSEOMeta(postWithArticleDefaults, siteData, baseUrl, canonicalUrl);

    const heroImage = post.frontmatter.heroImage
      ? `${baseUrl}${post.frontmatter.heroImage.replace(/^\//, '')}`
      : '';

    const backgroundImage = siteData.siteBackgroundImage
      ? `${baseUrl}${siteData.siteBackgroundImage}`
      : '';

    const html = generateHTML(template, {
      siteTitle: siteData.siteTitle,
      siteTagline: siteData.siteTagline,
      siteDescription: siteData.siteDescription,
      googleVerification: siteData.googleVerification,
      navItems: generateNavHTML(baseUrl),
      footerNavItems: generateFooterNavHTML(baseUrl),
      socialIcons: socialIconsHTML,
      schemaSameAs,
      year: new Date().getFullYear(),
      title: post.frontmatter.title,
      postDate: formatDate(post.frontmatter.date),
      postExcerpt: post.frontmatter.excerpt || '',
      content: normalizePostHtmlAssetPaths(post.content),
      heroImage,
      backgroundImage,
      sidebarContent: generateSidebarHTML(siteData, baseUrl),
      bodyClass: `single-post single-${slug}`,
      baseUrl,
      ...seoMeta
    });

    fs.writeFileSync(path.join(outputDir, 'index.html'), html);
    console.log(`- Built post: ${slug}/index.html`);
  });

  return posts;
}

// ============================================================
// BLOG LISTING BUILDER
// Reads content/pages/blog.md for meta, combines with the
// sorted posts list, and renders build/blog/index.html.
// ============================================================
function buildBlogListing(posts, siteData, generateNavHTML, generateFooterNavHTML, socialIconsHTML, schemaSameAs) {
  const blogMdPath = path.join(CONTENT_DIR, 'pages/blog.md');
  const blogPage = fs.existsSync(blogMdPath)
    ? processMarkdown(blogMdPath)
    : { frontmatter: { title: 'Blog' }, content: '', slug: 'blog' };

  const baseUrl = '../';
  const canonicalUrl = `${siteData.siteUrl}/blog/`;

  // Generate post cards HTML
  const postsList = posts.length > 0
    ? posts.map(post => {
        const slug = post.frontmatter.slug || post.slug;
        const heroImg = post.frontmatter.heroImage
          ? `<img src="${baseUrl}${post.frontmatter.heroImage.replace(/^\//, '')}" alt="${post.frontmatter.title}" class="post-card__image">`
          : '';
        return `
    <article class="post-card">
      <a href="${baseUrl}${slug}/" class="post-card__link">
        ${heroImg}
        <div class="post-card__content">
          <h2 class="post-card__title">${post.frontmatter.title}</h2>
          <time class="post-card__date">${formatDate(post.frontmatter.date)}</time>
          ${post.frontmatter.excerpt ? `<p class="post-card__excerpt">${post.frontmatter.excerpt}</p>` : ''}
        </div>
      </a>
    </article>`;
      }).join('\n')
    : '<p>No posts yet. Check back soon!</p>';

  const seoMeta = generateSEOMeta(blogPage, siteData, baseUrl, canonicalUrl);
  const template = readTemplate('blog');

  const backgroundImage = siteData.siteBackgroundImage
    ? `${baseUrl}${siteData.siteBackgroundImage}`
    : '';

  const html = generateHTML(template, {
    siteTitle: siteData.siteTitle,
    siteTagline: siteData.siteTagline,
    siteDescription: siteData.siteDescription,
    googleVerification: siteData.googleVerification,
    navItems: generateNavHTML(baseUrl),
    footerNavItems: generateFooterNavHTML(baseUrl),
    socialIcons: socialIconsHTML,
    schemaSameAs,
    year: new Date().getFullYear(),
    title: blogPage.frontmatter.title,
    content: blogPage.content,
    postsList,
    showPostsList: blogPage.frontmatter.showPostsList !== false,
    heroImage: blogPage.frontmatter.heroImage
      ? `${baseUrl}${blogPage.frontmatter.heroImage.replace(/^\//, '')}`
      : '',
    backgroundImage,
    sidebarContent: generateSidebarHTML(siteData, baseUrl),
    bodyClass: 'page-blog',
    baseUrl,
    ...seoMeta
  });

  fs.ensureDirSync(path.join(BUILD_DIR, 'blog'));
  fs.writeFileSync(path.join(BUILD_DIR, 'blog/index.html'), html);
  console.log('- Built: blog/index.html');

  return { sitemapUrl: '/blog/', sitemapPriority: '0.9', sitemapChangefreq: 'weekly' };
}

// Build all content
function buildAll() {
  console.log('Building content...');

  copyAssets();

  const siteData = readData('site');
  if (!siteData) {
    console.error('Error: data/site.json not found. Cannot build.');
    process.exit(1);
  }

  // Ensure output directories exist for all configured pages
  Object.values(PAGE_CONFIGS).forEach(config => {
    fs.ensureDirSync(path.dirname(path.join(BUILD_DIR, config.outputPath)));
  });

  function generateNavHTML(baseUrl) {
    return siteData.nav.map(item =>
      `<li><a href="${baseUrl}${item.url}">${item.label}</a></li>`
    ).join('\n                ');
  }

  function generateFooterNavHTML(baseUrl) {
    return (siteData.footerNav || []).map(item =>
      `<li><a href="${baseUrl}${item.url}">${item.label}</a></li>`
    ).join('\n        ');
  }

  const socialIconsHTML = (siteData.socialLinks || []).map(link =>
    `<a href="${link.url}" target="_blank" rel="noopener"><span class="social-icon ${link.icon}"></span></a>`
  ).join('\n        ');

  const schemaSameAs = JSON.stringify((siteData.socialLinks || []).map(l => l.url));

  const sitemapPages = [];

  // Build all static pages
  for (const [slug, config] of Object.entries(PAGE_CONFIGS)) {
    const mdPath = path.join(CONTENT_DIR, `pages/${slug}.md`);
    if (!fs.existsSync(mdPath)) {
      console.warn(`Warning: content/pages/${slug}.md not found, skipping.`);
      continue;
    }
    const pageMd = processMarkdown(mdPath);
    const template = readTemplate(config.template);
    const canonicalUrl = `${siteData.siteUrl}${config.sitemapUrl || '/'}`;
    const seoMeta = generateSEOMeta(pageMd, siteData, config.baseUrl, canonicalUrl);

    const customData = config.buildData
      ? config.buildData(pageMd, siteData, config.baseUrl)
      : {};

    const backgroundImage = siteData.siteBackgroundImage
      ? `${config.baseUrl}${siteData.siteBackgroundImage}`
      : '';

    const bodyClass = slug === 'index' ? 'home' : `page-${slug}`;

    const html = generateHTML(template, {
      siteTitle: siteData.siteTitle,
      siteTagline: siteData.siteTagline,
      siteDescription: siteData.siteDescription,
      googleVerification: siteData.googleVerification,
      navItems: generateNavHTML(config.baseUrl),
      footerNavItems: generateFooterNavHTML(config.baseUrl),
      socialIcons: socialIconsHTML,
      schemaSameAs,
      year: new Date().getFullYear(),
      title: pageMd.frontmatter.title,
      content: pageMd.content,
      heroImage: pageMd.frontmatter.heroImage
        ? `${config.baseUrl}${pageMd.frontmatter.heroImage.replace(/^\//, '')}`
        : '',
      backgroundImage,
      sidebarContent: generateSidebarHTML(siteData, config.baseUrl),
      bodyClass,
      baseUrl: config.baseUrl,
      ...seoMeta,
      ...customData
    });

    fs.writeFileSync(path.join(BUILD_DIR, config.outputPath), html);
    console.log(`- Built: ${config.outputPath}`);

    if (config.sitemapUrl) {
      sitemapPages.push({
        url: config.sitemapUrl,
        priority: config.sitemapPriority,
        changefreq: config.sitemapChangefreq
      });
    }
  }

  // Build blog posts
  const posts = buildPosts(siteData, generateNavHTML, generateFooterNavHTML, socialIconsHTML, schemaSameAs);

  // Add each post to sitemap
  posts.forEach(post => {
    const slug = post.frontmatter.slug || post.slug;
    sitemapPages.push({
      url: `/${slug}/`,
      priority: '0.7',
      changefreq: 'yearly'
    });
  });

  // Build blog listing
  const blogListingMeta = buildBlogListing(posts, siteData, generateNavHTML, generateFooterNavHTML, socialIconsHTML, schemaSameAs);
  sitemapPages.push({
    url: blogListingMeta.sitemapUrl,
    priority: blogListingMeta.sitemapPriority,
    changefreq: blogListingMeta.sitemapChangefreq
  });

  // Generate sitemap.xml
  const sitemap = generateSitemap(sitemapPages, siteData.siteUrl);
  fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), sitemap);
  console.log('Generated sitemap.xml');

  // Generate robots.txt
  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${siteData.siteUrl}/sitemap.xml`;
  fs.writeFileSync(path.join(BUILD_DIR, 'robots.txt'), robotsTxt);
  console.log('Generated robots.txt');

  // Add .nojekyll for GitHub Pages
  fs.writeFileSync(path.join(BUILD_DIR, '.nojekyll'), '');

  console.log(`\nBuild complete! ${posts.length} posts + ${Object.keys(PAGE_CONFIGS).length} pages.`);
}

// Watch mode
function watch() {
  console.log('Watching for changes...');

  const scriptsDir = path.join(__dirname, '..', 'scripts');
  const adminDir = path.join(__dirname, '..', 'admin');
  const watcher = chokidar.watch([
    path.join(CONTENT_DIR, '**/*.md'),
    path.join(TEMPLATES_DIR, '**/*.html'),
    path.join(DATA_DIR, '**/*.json'),
    path.join(ASSETS_DIR, '**/*'),
    path.join(STATIC_DIR, '**/*'),
    scriptsDir,
    ...(fs.existsSync(adminDir) ? [adminDir] : [])
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
