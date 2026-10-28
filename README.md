# Mephitideus Interactive — Website

The official landing site for **Mephitideus Interactive**, an indie game
studio showcasing our games — starting with
[Skunked: Way of the Spray](https://skunked.io/).

## Structure

```
index.html      Home page — hero, games showcase, about, contact
skunked.html    Dedicated detail page for Skunked: Way of the Spray
css/styles.css  All styling (dark theme, single stylesheet)
js/main.js      Mobile nav toggle, footer year, scroll-reveal animation
assets/         Images and logo (see assets/README.md)
```

Plain HTML/CSS/JS, no build step, no dependencies.

## SEO and crawler maintenance

Every public HTML page has a canonical URL, social preview metadata, and static
JSON-LD. Keep game names and their `#game` identifiers consistent across pages.
Each page defines the studio's `#organization` entity locally so its publisher
reference does not depend on a crawler fetching the homepage first. Store
listings identify the games, not the studio, so they belong on game `sameAs`
properties rather than the organization's.

When adding a page, link it from the site and add its canonical URL to
`sitemap.xml` and `llms.txt`. Use locally hosted preview artwork. Article
publication dates should match the visible byline; the initial guide dates
are based on their September 30, 2026 first-added git history. Only add or
change modification dates (including sitemap `lastmod`) for genuine content
updates, not automatically on every deployment.

`robots.txt` allows search crawlers and preserves the existing AI-training
permissions. Search visibility and training are separate choices.
`llms.txt` is an optional plain-text guide, not a standardized ranking signal
or a replacement for crawlable HTML, internal links, and the sitemap.

Run the dependency-free checks with Node.js 18 or newer:

```powershell
node scripts\check-seo.mjs
```

These are local consistency checks, not a complete HTML or Schema.org validator.
After deployment, verify canonical URLs and indexing in Google Search Console
and Bing Webmaster Tools, submit the sitemap, and test structured data with
Google's Rich Results Test and the Schema.org validator. Indexing and AI
citations are not guaranteed by crawler permissions or structured data.

## Local preview

```powershell
python -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Deploying to GitHub Pages

1. Push this repo to GitHub (`main` branch).
2. In the repo settings, go to **Pages** → set source to `Deploy from a branch`
   → branch `main`, folder `/ (root)`.
3. Your site will be live at `https://<username>.github.io/Mephitideus/`
   (or your custom domain, if configured via a `CNAME` file).

## Adding a new game

Duplicate the featured `<article class="game-card">` block in `index.html`,
update the copy/links, and optionally create a new detail page modeled on
`skunked.html`.
