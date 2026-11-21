// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { closeSync, existsSync, openSync, readFileSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
 * Under `astro dev` only: run the jobs listed in private/local-jobs.json on their timers while the dev server is up.
 * The file is gitignored, so only a machine that has one runs anything. On macOS, launchd jobs can't read
 * ~/Documents unless their shell has Full Disk Access, and a job started here inherits the terminal's access instead.
 * Each job is { name, run: [command, ...args], every: minutes, out: log file, skipIfFresh?: file }. A job never
 * starts while its last run is still going, and one with skipIfFresh waits while that file is newer than its
 * interval, so a second dev server or a working launchd job doesn't double the work. ALMANAC_LOCAL_JOBS=0 turns
 * them all off.
 */
const localJobs = {
  name: 'local-jobs',
  hooks: {
    /** @param {{ command: string, logger: { info: (m: string) => void, warn: (m: string) => void } }} options */
    'astro:config:setup': ({ command, logger }) => {
      const list = new URL('./private/local-jobs.json', import.meta.url);
      if (command !== 'dev' || process.env.ALMANAC_LOCAL_JOBS === '0' || !existsSync(list)) return;
      // a config change restarts the dev server in the same process: stop the old timers, keep the busy marks
      const g = /** @type {{ __localJobs?: { timers: NodeJS.Timeout[], busy: Set<string> } }} */ (globalThis);
      const state = (g.__localJobs ??= { timers: [], busy: new Set() });
      for (const t of state.timers.splice(0)) clearTimeout(t);
      const root = fileURLToPath(new URL('./', import.meta.url));
      /** @type {{ name: string, run: string[], every: number, out: string, skipIfFresh?: string }[]} */
      let jobs;
      try {
        jobs = JSON.parse(readFileSync(list, 'utf8'));
      } catch (e) {
        logger.warn(`private/local-jobs.json is not valid JSON, so no local jobs run: ${e}`);
        return;
      }
      for (const job of jobs) {
        const tick = () => {
          if (state.busy.has(job.name)) return;
          const fresh = job.skipIfFresh && existsSync(join(root, job.skipIfFresh)) && Date.now() - statSync(join(root, job.skipIfFresh)).mtimeMs < job.every * 54_000;
          if (fresh) return;
          state.busy.add(job.name);
          const out = openSync(join(root, job.out), 'a');
          const done = () => {
            state.busy.delete(job.name);
            closeSync(out);
          };
          const child = spawn(job.run[0], job.run.slice(1), { cwd: root, stdio: ['ignore', out, out] });
          // a command that can't start won't start next time either, so the job stays marked busy until a restart
          child.on('error', (e) => {
            logger.warn(`local job ${job.name} could not start, so it stops until the dev server restarts: ${e.message}`);
            closeSync(out);
          });
          child.on('exit', done);
        };
        // the first run waits a minute, so a dev server restart doesn't start every job at once
        state.timers.push(setTimeout(tick, 60_000).unref(), setInterval(tick, job.every * 60_000).unref());
      }
      logger.info(`local jobs: ${jobs.map((j) => `${j.name} every ${j.every} min`).join(', ')}`);
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
  // Reporting moved under Insights on 2026-11-17. Vercel sends the same redirect with the query kept (vercel.json).
  redirects: { '/benchmarks/factscore-precision/': '/benchmarks/factscore/', '/benchmarks/programbench-almost/': '/benchmarks/programbench/', '/benchmarks/programbench-tests-passed/': '/benchmarks/programbench/', '/reporting': '/insights/reporting/' },
  build: { inlineStylesheets: 'auto' },
  integrations: [sitemap({ serialize: (item) => ({ ...item, lastmod: lastmodOf(item.url) }) }), ogFilm, localJobs],
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
