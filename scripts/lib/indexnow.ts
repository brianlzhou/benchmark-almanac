// IndexNow tells Bing and the other IndexNow search engines (Yandex, Seznam, Naver and more) which pages changed, so
// they crawl them soon instead of waiting for the sitemap. Google doesn't take part and reads the sitemap.
//
// A production build gives each page in the sitemap a fingerprint: a hash of its title, its description and the text
// of its <main>, which is what a search engine indexes. The header, the footer, scripts and markup stay out, so a new
// asset name or a new footer count doesn't count as a change. The sitemap's lastmod can't do this job: about 2,800
// pages take the data's date, which moves with every sync whether the page changed or not.
//
// The build writes the fingerprints to /indexnow/pages.txt, reads the live site's copy, and lists the pages that are
// new or changed in /indexnow/changed.txt (the indexnow integration in astro.config.mjs). Once the deploy is live,
// scripts/indexnow.ts sends that list (.github/workflows/indexnow.yml).
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const SITE = 'https://www.benchmarkalmanac.com';
/** The site's IndexNow key. public/<key>.txt holds it, so a search engine can check that the list came from the site. */
export const INDEXNOW_KEY = 'cb2eb341ad69961bff311fd491e6b2b4';
export const PAGES_FILE = 'indexnow/pages.txt';
export const CHANGED_FILE = 'indexnow/changed.txt';
/** The most URLs one IndexNow request may carry. */
const BATCH = 10_000;

/**
 * A page's fingerprint: 12 hex digits of a hash of its title, its description and the text of its main element. The
 * text loses its tags and its spaces too, so markup that moves around the same words (a word put in bold) isn't a change.
 */
export function pageDigest(html: string): string {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const start = html.indexOf('<main');
  const end = html.lastIndexOf('</main>');
  const main =
    start < 0 || end < start
      ? ''
      : html
          .slice(start, end)
          .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/g, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, '');
  return createHash('sha256').update(`${title}\n${description}\n${main}`).digest('hex').slice(0, 12);
}

/** The paths the built sitemap lists, such as "/benchmarks/gpqa-diamond/". */
export function sitemapPaths(dist: string): string[] {
  const files = readdirSync(dist).filter((f) => /^sitemap-\d+\.xml$/.test(f));
  if (!files.length) throw new Error('IndexNow: the build has no sitemap files');
  return files.flatMap((f) => [...readFileSync(join(dist, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
}

/** The fingerprint file: a "# commit <sha>" line, then a "<path> <fingerprint>" line for each page. */
export function formatPages(commit: string, pages: Map<string, string>): string {
  return [`# commit ${commit}`, ...[...pages].sort(([a], [b]) => (a < b ? -1 : 1)).map(([p, d]) => `${p} ${d}`), ''].join('\n');
}

export function parsePages(text: string): { commit: string; pages: Map<string, string> } {
  const [head, ...lines] = text.trim().split('\n');
  const commit = head?.match(/^# commit (\S+)$/)?.[1];
  if (!commit) throw new Error('the fingerprint file has no commit line');
  const pages = new Map<string, string>();
  for (const line of lines) {
    const [path, digest] = line.split(' ');
    if (!path?.startsWith('/') || !digest) throw new Error(`the fingerprint file has a bad line: ${line.slice(0, 80)}`);
    pages.set(path, digest);
  }
  return { commit, pages };
}

/** The pages to send: new pages, and pages whose fingerprint changed. With no live fingerprints, every page is new. */
export function changedPaths(live: Map<string, string> | null, next: Map<string, string>): string[] {
  return [...next].filter(([p, d]) => live?.get(p) !== d).map(([p]) => p).sort();
}

/**
 * The list file: "# commit <sha>" for this build, "# base <sha>" for the live build it was compared with ("none" when
 * the live site had no fingerprints, "unknown" when the build couldn't read them), then one path on each line.
 */
export function formatChanged(commit: string, base: string, paths: string[]): string {
  return [`# commit ${commit}`, `# base ${base}`, ...paths, ''].join('\n');
}

export function parseChanged(text: string): { commit?: string; base?: string; paths: string[] } {
  const lines = text.trim().split('\n');
  const tag = (k: string) => lines.find((l) => l.startsWith(`# ${k} `))?.slice(k.length + 3);
  return { commit: tag('commit'), base: tag('base'), paths: lines.filter((l) => l.startsWith('/')) };
}

/** Writes /indexnow/pages.txt and /indexnow/changed.txt into a finished build. */
export async function writeIndexNowFiles(dist: string, commit: string, log: (s: string) => void = console.log): Promise<void> {
  const pages = new Map<string, string>();
  for (const path of sitemapPaths(dist)) pages.set(path, pageDigest(readFileSync(join(dist, decodeURIComponent(path), 'index.html'), 'utf8')));
  mkdirSync(join(dist, 'indexnow'), { recursive: true });
  writeFileSync(join(dist, PAGES_FILE), formatPages(commit, pages));
  let base = 'unknown';
  let paths: string[] = [];
  try {
    const res = await fetch(`${SITE}/${PAGES_FILE}`, { signal: AbortSignal.timeout(30_000) });
    if (res.status === 404) {
      base = 'none';
      paths = changedPaths(null, pages);
    } else if (!res.ok) throw new Error(`HTTP ${res.status}`);
    else {
      const live = parsePages(await res.text());
      paths = changedPaths(live.pages, pages);
      base = live.commit;
    }
  } catch (e) {
    log(`IndexNow: the live fingerprints could not be read, so this deploy sends no pages (${(e as Error).message})`);
  }
  writeFileSync(join(dist, CHANGED_FILE), formatChanged(commit, base, paths));
  log(`IndexNow: ${pages.size.toLocaleString('en-US')} pages fingerprinted, ${paths.length.toLocaleString('en-US')} new or changed since ${base}`);
}

/** Whether a GitHub status event is Vercel finishing a deploy of a commit on main, the branch that deploys to production. */
export function isProductionDeploy(e: { context?: string; state?: string; branches?: { name: string }[] }): boolean {
  return e.context === 'Vercel' && e.state === 'success' && !!e.branches?.some((b) => b.name === 'main');
}

/** Sends full URLs on the site to IndexNow, which shares them with every engine that takes part. */
export async function sendToIndexNow(urls: string[]): Promise<void> {
  for (let i = 0; i < urls.length; i += BATCH) {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(SITE).host, key: INDEXNOW_KEY, urlList: urls.slice(i, i + BATCH) }),
      signal: AbortSignal.timeout(60_000),
    });
    // 200 means taken, and 202 means taken while the engine still checks the key file
    if (res.status !== 200 && res.status !== 202) throw new Error(`IndexNow answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}
