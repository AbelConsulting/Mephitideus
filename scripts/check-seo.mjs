import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://www.mephitideus.com';
const organizationId = `${origin}/#organization`;
const read = (file) => readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const sitemap = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1]);
assert(sitemap.length > 0, 'Sitemap must contain URLs');
assert.equal(new Set(sitemap).size, sitemap.length, 'Duplicate sitemap URLs');

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.name.endsWith('.html') ? [target] : [];
  });
}

function objects(value) {
  if (!value || typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(objects)];
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)]
    .map((match) => [match[1], match[2]]));
}

const games = new Map();
const canonicals = [];
for (const file of htmlFiles(root)) {
  const label = path.relative(root, file);
  const html = readFileSync(file, 'utf8');
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/g)]
    .map((match) => attributes(match[0]));
  const meta = (name) => {
    const matches = tags.filter((tag) => tag.name === name || tag.property === name);
    assert.equal(matches.length, 1, `${label}: expected one ${name}`);
    assert(matches[0].content?.trim(), `${label}: empty ${name}`);
    return matches[0].content;
  };
  const canonicalTags = tags.filter((tag) => tag.rel === 'canonical');
  assert.equal(canonicalTags.length, 1, `${label}: expected one canonical`);
  const canonical = canonicalTags[0].href;
  assert(sitemap.includes(canonical), `${label}: canonical missing from sitemap`);
  const expectedPath = `/${label.split(path.sep).join('/')}`.replace(/index\.html$/, '');
  assert.equal(canonical, `${origin}${expectedPath}`, `${label}: wrong canonical`);
  canonicals.push(canonical);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${label}: expected one h1`);
  assert(/<title>[^<]+<\/title>/.test(html), `${label}: missing title`);
  meta('description');
  assert.equal(meta('og:url'), canonical, `${label}: sharing URL mismatch`);
  for (const name of ['og:title', 'og:description', 'og:image:alt',
    'twitter:title', 'twitter:description', 'twitter:image:alt']) meta(name);
  assert.equal(meta('twitter:card'), 'summary_large_image', label);
  assert.equal(meta('robots'), 'max-image-preview:large', label);
  assert.equal(meta('twitter:image'), meta('og:image'), `${label}: image mismatch`);
  const image = new URL(meta('og:image'));
  assert.equal(image.origin, origin, `${label}: use locally hosted preview art`);
  assert(existsSync(path.join(root, decodeURIComponent(image.pathname))), `${label}: missing preview image`);

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert(blocks.length > 0, `${label}: missing structured data`);
  const nodes = blocks.flatMap((match) => objects(JSON.parse(match[1])));
  assert(nodes.some((node) => node['@type'] === 'Organization'
    && node['@id'] === organizationId && node.name === 'Mephitideus Interactive'
    && node.url === `${origin}/` && node.logo), `${label}: undefined publisher`);
  if (canonical !== `${origin}/`) {
    const breadcrumbs = nodes.filter((node) => node['@type'] === 'BreadcrumbList');
    assert.equal(breadcrumbs.length, 1, `${label}: expected one breadcrumb list`);
    const items = breadcrumbs[0].itemListElement;
    assert(items.length >= 2, `${label}: incomplete breadcrumbs`);
    items.forEach((item, index) => {
      assert.equal(item.position, index + 1, `${label}: breadcrumb order`);
      assert(sitemap.includes(item.item), `${label}: breadcrumb not in sitemap`);
    });
    assert.equal(items[0].item, `${origin}/`, `${label}: breadcrumb root`);
    assert.equal(items.at(-1).item, canonical, `${label}: breadcrumb destination`);
  }
  for (const node of nodes.filter((node) => ['Article', 'BlogPosting'].includes(node['@type'])
    && node.mainEntityOfPage)) {
    assert.equal(node.mainEntityOfPage, canonical, label);
    assert.equal(node.datePublished, meta('article:published_time'), `${label}: publication mismatch`);
    assert(html.includes(`<time datetime="${node.datePublished.slice(0, 10)}">`),
      `${label}: publication date not visible`);
  }
  for (const game of nodes.filter((node) => node['@type'] === 'VideoGame')) {
    assert.equal(game['@id'], `${game.url}#game`, `${label}: game identity`);
    assert.equal(game.publisher['@id'], organizationId, `${label}: game publisher`);
    if (games.has(game['@id'])) {
      assert.equal(game.name, games.get(game['@id']), `${label}: game name mismatch`);
    }
    games.set(game['@id'], game.name);
  }
  for (const match of html.matchAll(/<(?:a|link|img|script)\b[^>]*>/g)) {
    const tag = attributes(match[0]);
    const target = tag.href || tag.src;
    if (!target || target.startsWith('#') || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(target)) continue;
    const localPath = decodeURIComponent(target.split(/[?#]/)[0]);
    const resolved = localPath.startsWith('/')
      ? path.join(root, localPath) : path.resolve(path.dirname(file), localPath);
    assert(existsSync(resolved), `${label}: broken local link ${target}`);
  }
}
assert.deepEqual([...canonicals].sort(), [...sitemap].sort(), 'Sitemap must cover every HTML page once');
const robots = read('robots.txt');
for (const agent of ['*', 'OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'GPTBot']) {
  assert(robots.includes(`User-agent: ${agent}\nAllow: /`), `Missing crawler permission: ${agent}`);
}
assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`), 'Missing sitemap discovery');
const summary = read('llms.txt');
for (const url of sitemap) assert(summary.includes(url), `Site summary missing ${url}`);
console.log(`SEO checks passed: ${canonicals.length} pages, structured data, breadcrumbs, dates, assets, local links, sitemap, and crawler discovery.`);
