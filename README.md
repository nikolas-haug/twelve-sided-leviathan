# Twelve-Sided Leviathan Website

A TTRPG blog website built with a lightweight UI framework and markdown-based content management.

## Features

- **Markdown-based content**: Write blog posts and pages in Markdown
- **Static site generation**: Builds static HTML files for GitHub Pages
- **Lightweight framework**: Custom SCSS framework with responsive grid system
- **Blogger-style design**: Classic blog layout with sidebar navigation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build CSS:
```bash
npm run build:css
```

3. Build content (generates HTML from markdown):
```bash
npm run build:content
```

4. Build everything:
```bash
npm run build:all
```

## Development

Start the development server with live reloading:

```bash
npm start
```

This will:
- Watch SCSS files and rebuild CSS on changes
- Watch markdown files and rebuild HTML on changes
- Serve the site from the `build/` directory

## Project Structure

```
twelve-sided-leviathan-website/
├── content/
│   ├── posts/           # Blog post markdown files
│   └── pages/           # Static page markdown files
├── assets/
│   └── images/          # Image assets
├── templates/           # HTML templates for markdown processing
├── src/                 # SCSS source files
├── js/                  # JavaScript files
├── dist/                # Compiled CSS output
├── build/               # Generated HTML pages (for GitHub Pages)
└── scripts/             # Build scripts
```

## Writing Content

### Blog Posts

Create markdown files in `content/posts/` with frontmatter:

```markdown
---
title: "My Post Title"
date: 2025-01-15
author: "Your Name"
excerpt: "A brief excerpt"
tags: ["Tag1", "Tag2"]
---

Your post content here...
```

### Pages

Create markdown files in `content/pages/`:

```markdown
---
title: "About"
---

Your page content here...
```

## GitHub Pages Deployment

GitHub Pages serves static files from either:
- The repository root (looks for `index.html`)
- The `/docs` folder

### Option 1: Deploy to `/docs` folder (Recommended)

1. Build and deploy:
```bash
npm run deploy:all
```

This will:
- Build CSS and content
- Copy everything from `build/` to `docs/`

2. Commit and push:
```bash
git add docs/
git commit -m "Deploy site"
git push
```

3. In GitHub repository settings:
   - Go to Settings → Pages
   - Under "Source", select "Deploy from a branch"
   - Choose "main" (or "master") branch
   - Select `/docs` folder
   - Click Save

### Option 2: Deploy to root

If you prefer to serve from the root:

1. Build the site:
```bash
npm run build:all
```

2. Manually copy contents of `build/` to the repository root, or use:
```bash
cp -r build/* .
```

3. Commit and push. GitHub Pages will automatically serve `index.html` from the root.

**Note:** With Option 2, you'll need to be careful not to commit source files (SCSS, templates, etc.) that shouldn't be in the root. The `/docs` approach keeps your source files separate.

## Customization

- **Colors & Typography**: Edit `src/_variables.scss`
- **Blog Styling**: Edit `src/_custom.scss`
- **Templates**: Edit files in `templates/`

## License

ISC

