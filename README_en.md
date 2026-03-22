# Academic Homepage Template

[中文说明](README_cn.md) | [Quick Start](#-turning-it-into-your-own-homepage)

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-222222?logo=githubpages)
![Static Site](https://img.shields.io/badge/Static%20Site-HTML%2FCSS%2FJS-0f766e)
![No Build](https://img.shields.io/badge/No%20Build-Required-2563eb)
![Content Model](https://img.shields.io/badge/Content-Markdown%20%2B%20JSON-a21caf)

This repository is a static academic homepage template designed for GitHub Pages. It now uses a lightweight “Markdown + JSON + plain JavaScript” content model:

- main homepage content comes from `data/academic.md`
- publications come from `data/publications.json`
- news comes from `data/news.json`
- Google Scholar citation data comes from `scripts/scholar.json`

The goal is to keep the site structured, easy to maintain, and simple to deploy without a build system.

## ✨ Features

- Split homepage and archive pages: the homepage shows selected publications and recent news, while full lists live on dedicated pages
- Optional guestbook page via GitHub Discussions + giscus, with Markdown support and GitHub login
- Structured content: publications and news are managed with JSON
- Lightweight frontend: no framework, no bundler, no dependency installation
- Citation merge pipeline: manually maintained publication metadata is merged with Scholar citation counts
- Responsive layout for both desktop and mobile

## 🗂️ Project Structure

```text
.
├── index.html                 # Homepage
├── publications.html          # Full publication archive
├── news.html                  # Full news archive
├── messages.html              # Guestbook page backed by GitHub Discussions
├── data/
│   ├── academic.md            # Non-structured homepage content (Biography / Education / Awards / etc.)
│   ├── publications.json      # Publication data source
│   └── news.json              # News data source
├── scripts/
│   ├── homepage.js            # Homepage rendering logic
│   ├── publications.js        # Publication rendering logic
│   ├── news.js                # News rendering logic
│   ├── messages.js            # Guestbook / giscus integration
│   ├── site-utils.js          # Shared frontend utilities
│   ├── scholar.json           # Cached Scholar data
│   ├── scholar_fetch.py       # Scholar fetching script
│   ├── scholar_format.py      # Scholar HTML formatter
│   ├── scholar_crawler.py     # Compatibility crawler
│   └── sitemap_generator.py   # Sitemap generator
├── styles/
│   ├── site.css               # Page-level shared styles
│   └── details.css            # Publication / news / filter / archive component styles
├── docs/                      # Publication assets (thumbnails, BibTeX, slides, posters, etc.)
└── images/                    # Site image assets
```

## ✍️ Content Management

### 1. 🏠 Edit general homepage content

Edit `data/academic.md`.

This file is best for:

- biography
- education
- awards
- contact information
- any homepage content that is easier to write as Markdown

Notes:

- the `News` section should only keep `<div id="recent-news-section"></div>`
- the `Publications` section should only keep `<div id="featured-publications-section"></div>`

Those containers are filled by frontend scripts.

### 2. 📚 Edit publications

Edit `data/publications.json`.

Each publication currently supports fields such as:

- `id`
- `order`
- `featured`
- `section`
- `type`
- `level`
- `keyword`
- `author_role`
- `tag`
- `year`
- `title`
- `authors_html`
- `venue_html`
- `thumbnail`
- `thumbnail_alt`
- `scholar_id`
- `github_repo`
- `links`

Important behavior:

- publications with `featured: true` appear on the homepage
- `keyword` is used by archive filtering
- `author_role` is used by author-role filtering
- `scholar_id` is only used to align manual metadata with citation data in `scripts/scholar.json`

Homepage publication summary data is also stored in the same file:

- `homepage_featured_limit`
- `homepage_summary`

### 3. 📰 Edit news

Edit `data/news.json`.

Each news item currently supports fields such as:

- `id`
- `order`
- `date`
- `year`
- `theme`
- `icon`
- `content_html`

Important behavior:

- the homepage shows only the most recent year of news
- the full news archive supports filtering by `Year` and `Theme`

## 📈 Scholar Data

Publication title, author list, venue, links, and other metadata are now maintained manually in `data/publications.json`.

Google Scholar is only used for:

- per-paper citation counts
- total citation count

Relevant files:

- `scripts/scholar.json`
- `scripts/scholar_fetch.py`
- `scripts/scholar_format.py`
- `scripts/scholar_crawler.py`

Recommended workflow:

1. obtain raw Scholar page content
2. update `scripts/scholar.json`
3. let the frontend merge citation counts during rendering

## 💬 Guestbook

The guestbook uses `GitHub Discussions + giscus`.

To enable it:

1. turn on GitHub Discussions for the repository
2. create a discussion category such as `Guestbook`
3. get the `repo-id` and `category-id` from `https://giscus.app`
4. replace the placeholder values in `scripts/messages.js`

Once configured, visitors can sign in with GitHub, write messages in Markdown, and interact directly on the site.

## 🧪 Local Preview

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000
```

Recommended pages to check:

- `/index.html`
- `/publications.html`
- `/news.html`

## 🚀 Turning It Into Your Own Homepage

If you want to adapt this repository into your own academic homepage, the workflow below is the most practical starting point.

### 1. 🧱 Create your own repository

Two common options work well:

- fork this repository
- use GitHub's "Use this template" button

If you want to deploy it as a GitHub Pages personal site, the repository name is usually:

```text
<your-username>.github.io
```

### 2. 🎯 Make the minimum first-pass replacements

For the first round of customization, focus on the most important identity/content files:

1. page titles and meta tags in `index.html`, `publications.html`, and `news.html`
2. biography, education, awards, and contact information in `data/academic.md`
3. publication entries in `data/publications.json`
4. news entries in `data/news.json`
5. profile and site assets in `images/`

In most cases, that is enough to turn the project into a usable personal homepage without touching the frontend logic.

### 3. 🧩 Prefer editing data files instead of scripts

The current structure is designed to keep content and rendering logic separate:

- edit publications in `data/publications.json`
- edit news in `data/news.json`
- edit general homepage content in `data/academic.md`

Unless you want to change the interaction logic, filtering behavior, or visual design, you usually do not need to touch:

- `scripts/homepage.js`
- `scripts/publications.js`
- `scripts/news.js`
- `scripts/site-utils.js`

### 4. 🔄 Replace Scholar alignment data with your own

If you also want Scholar citation badges:

1. fetch data from your own Scholar page
2. regenerate or replace `scripts/scholar.json`
3. make sure each paper in `data/publications.json` has the correct `scholar_id`

Important: this project treats `data/publications.json` as the source of truth for titles, authors, venues, and links. Scholar is only used for citation counts.

### 5. 👀 Preview locally before pushing

After major edits, preview the site locally:

```bash
python3 -m http.server 8000
```

Then check:

- whether the homepage still renders Biography / News / Publications / Education / Awards
- whether selected publications and recent news load correctly
- whether filters still work on `publications.html` and `news.html`
- whether images, publication links, code links, and badges all render correctly

### 6. ☁️ Push to GitHub Pages

Once everything looks right, commit and push:

```bash
git add .
git commit -m "Customize homepage"
git push
```

If the repository is named `<your-username>.github.io`, GitHub Pages will usually update automatically after the push.

## 🛠️ Customization Checklist

If you are adapting this template for your own site, start with:

1. `<title>` and `<meta>` tags in `index.html`, `publications.html`, and `news.html`
2. `data/academic.md`
3. `data/publications.json`
4. `data/news.json`
5. assets in `images/` and `docs/`

You usually do not need to edit first:

- `scripts/homepage.js`
- `scripts/publications.js`
- `scripts/news.js`
- `scripts/site-utils.js`
- `styles/site.css`
- `styles/details.css`

## 📦 Deployment

If your repository is named `<your-username>.github.io`, you can deploy it directly with GitHub Pages.

Typical workflow:

```bash
git add .
git commit -m "Update homepage content"
git push
```

## 🙌 Notes

This project intentionally avoids frameworks and build tooling. The tradeoff is that some structure is handled manually, but the benefit is very low deployment and maintenance complexity.

If this template is useful for you, feel free to star the repository or adapt it into your own homepage.
