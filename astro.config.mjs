// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

/** Under `astro dev` only, the pages scripts/og-film.ts films the link-preview videos from. */
const ogFilm = {
  name: 'og-film',
  hooks: {
    /** @param {{ command: string, injectRoute: (route: { pattern: string, entrypoint: string }) => void }} options */
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') injectRoute({ pattern: '/og-film/[scene]', entrypoint: './src/og-film/Film.astro' });
    },
  },
};

/**
 * The sitemap's lastmod: when a page's content last changed, read from the data. A benchmark page changes when a
 * score or a model card for it is added, a model page when one of its scores or cards is, a lab page when one of
 * its cards is. Every other page is rebuilt from the whole dataset, so it takes the data's date (AS_OF in
 * src/lib/data.ts). Search engines trust lastmod only when it tracks real changes, so no page gets today's date
 * for nothing.
 */
/** @type {{ m: Map<string, string>, asOf: string } | undefined} */
let lastmods;
/** @param {string} url */
function lastmodOf(url) {
  if (!lastmods) {
    const read = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`./data/${f}`, import.meta.url), 'utf8'));
    const lb = read('scores/leaderboards.json');
    const epoch = read('scores/epoch.json');
    const docs = [...read('cards.json'), ...read('system-cards.json')];
    const asOf = [epoch.retrieved, lb.retrieved, ...docs.map((d) => d.date)].filter(Boolean).sort().at(-1);
    /** @type {Map<string, string>} */
    const m = new Map();
    const bump = (/** @type {string} */ path, /** @type {string | undefined} */ d) => {
      if (d && d <= asOf && !((m.get(path) ?? '') >= d)) m.set(path, d.length === 7 ? `${d}-01` : d);
    };
    for (const src of [lb, epoch]) {
      const [bi, mi, di] = ['benchmark', 'model', 'date'].map((c) => src.columns.indexOf(c));
      for (const r of src.rows) {
        bump(`/benchmarks/${r[bi]}/`, r[di]);
        bump(`/models/${r[mi]}/`, r[di]);
      }
    }
    for (const d of docs) {
      bump(`/models/${d.model}/`, d.date);
      bump(`/labs/${d.lab}/`, d.date);
      for (const r of d.results ?? []) bump(`/benchmarks/${r.benchmark}/`, d.date);
    }
    lastmods = { m, asOf };
  }
  return lastmods.m.get(new URL(url).pathname) ?? lastmods.asOf;
}

export default defineConfig({
  // Canonical URLs, the sitemap and link previews need absolute URLs. SITE_URL overrides the production host.
  site: process.env.SITE_URL || 'https://www.benchmarkalmanac.com',
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
  integrations: [sitemap({ serialize: (item) => ({ ...item, lastmod: lastmodOf(item.url) }) }), ogFilm],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Newsreader',
      cssVariable: '--font-serif',
      weights: ['400'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Geist',
      cssVariable: '--font-sans',
      weights: ['400', '500', '600'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Geist Mono',
      cssVariable: '--font-mono',
      weights: ['400', '500'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
});
