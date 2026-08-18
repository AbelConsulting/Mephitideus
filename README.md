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
