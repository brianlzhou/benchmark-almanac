// Groups that build and run their own benchmarks: Vals AI, Arena through its Hugging Face dataset, and Kaggle
// Benchmarks, where anyone can publish a benchmark and run models on it.
import { key, readJson, dataPath } from '../util.ts';
import { FROM, GENERAL, NICHE, humanize, type Reader } from './core.ts';
import { parseFeed, decode } from './text.ts';

// Vals AI announces each new benchmark on its blog, and each post links the benchmark's page. Its robots.txt
// allows everything but three form endpoints, and the site has no terms page.
export async function vals(r: Reader) {
  const SITE = 'https://www.vals.ai';
  const posts = parseFeed(await r.text(`${SITE}/blogs/rss.xml`)).filter((p) => p.date >= FROM);
  r.read(posts.length);
  const slugs = new Map<string, string>();
  for (const p of posts) {
    const html = await r.text(p.link).catch(() => '');
    for (const m of html.matchAll(/href="(?:https:\/\/www\.vals\.ai)?\/benchmarks\/([a-z0-9][a-z0-9-]*)\/?"/g)) if (!slugs.has(m[1])) slugs.set(m[1], p.link);
  }
  for (const [slug, post] of [...slugs].slice(0, 15)) {
    const url = `${SITE}/benchmarks/${slug}`;
    const page = await r.text(url).catch(() => '');
    // "<title>Immigration Bench Leaderboard and Methodology | Vals AI</title>"
    const title = decode(page.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
    const nm = title.replace(/\s*\|\s*Vals AI\s*$/i, '').replace(/\s+(Leaderboard|Benchmark)?\s*(and|&)\s*Methodology$|\s+Leaderboard$/i, '').trim();
    if (!nm || /not found/i.test(nm)) continue;
    r.add({ key: key(nm), name: nm, title: nm, url, org: 'Vals AI', stageA: 5, general: true }, { registry: { source: 'Vals AI', url: post } });
  }
}

// Arena's terms forbid automated access to arena.ai, so the job reads only its CC BY 4.0 dataset on
// Hugging Face, where each new subset folder is a new arena or index.
export async function arena(r: Reader) {
  const REPO = 'lmarena-ai/leaderboard-dataset';
  const dirs = async (rev: string) =>
    (await r.json<{ type: string; path: string }[]>(`https://huggingface.co/api/datasets/${REPO}/tree/${rev}`)).filter((t) => t.type === 'directory').map((t) => t.path);
  const subsets = await dirs('main');
  r.read(subsets.length);
  const added = await r.fresh('arena', subsets, async () => {
    const commits = await r.json<{ id: string; date: string }[]>(`https://huggingface.co/api/datasets/${REPO}/commits/main?limit=1000`);
    const base = commits.find((c) => c.date.slice(0, 10) < FROM);
    if (!base) throw new Error(`no commit before ${FROM}`);
    return dirs(base.id);
  });
  for (const s of added) {
    const nm = `Arena ${humanize(s)}`;
    const url = `https://huggingface.co/datasets/${REPO}/tree/main/${s}`;
    r.add({ key: key(nm), name: nm, title: `${nm} (Arena leaderboard subset ${s})`, url, org: 'LMArena', stageA: 5, general: true }, { registry: { source: 'Arena', url } });
  }
  r.remember('arena', subsets);
}

// Kaggle's public API reads one benchmark's leaderboard but can't list benchmarks. So this reads the list that the
// page at kaggle.com/benchmarks loads: one request for the page and its XSRF cookie, then one request for each 200
// benchmarks, newest first, a second apart (about eight requests in all). The user chose on 2026-11-26 to read it,
// after the scan had missed Humanity's First Exam.
//
// A benchmark becomes a find when it meets the catalog's leaderboard test, five or more models on its board, or when
// an organization (Google DeepMind, Meta, Cohere Labs) published it. A community benchmark often gets its fifth model
// weeks after it opens, so the reader keeps the list of benchmarks that met the bar and reports the ones that met it
// since the last run. Benchmarks the catalog already links are known.
const KAGGLE = 'https://www.kaggle.com';
export const KAGGLE_MIN_MODELS = 5;
export interface KaggleBenchmark {
  slug?: string;
  name?: string;
  published?: boolean;
  organization?: { name?: string; slug?: string };
  ownerUser?: { userName?: string; displayName?: string };
  version?: { description?: string; leaderboardModelVersionsCount?: number; createTime?: string; publishTime?: string };
}
/** The path of a benchmark's page, "deepmind/hfe", or undefined for a draft. */
export function kagglePath(b: KaggleBenchmark): string | undefined {
  const owner = b.organization?.slug ?? b.ownerUser?.userName;
  return b.published !== false && owner && b.slug ? `${owner}/${b.slug}` : undefined;
}
/** Whether a listed benchmark meets the bar for a find. */
export function kaggleMeetsBar(b: KaggleBenchmark): boolean {
  return !!b.organization?.name || (b.version?.leaderboardModelVersionsCount ?? 0) >= KAGGLE_MIN_MODELS;
}

export async function kaggle(r: Reader) {
  const page = await r.request(`${KAGGLE}/benchmarks`);
  const cookie = page.headers.getSetCookie().map((c) => c.split(';')[0]);
  const xsrf = cookie.find((c) => /^XSRF-TOKEN=/i.test(c))?.slice('XSRF-TOKEN='.length);
  if (!xsrf) throw new Error('kaggle.com/benchmarks set no XSRF cookie');
  const list: KaggleBenchmark[] = [];
  let token: string | undefined;
  for (let i = 0; i < 20; i++) {
    if (i) await new Promise((res) => setTimeout(res, 1000));
    const res = await r.json<{ benchmarks?: KaggleBenchmark[]; nextPageToken?: string }>(`${KAGGLE}/api/i/benchmarks.BenchmarkService/ListBenchmarks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-xsrf-token': xsrf, cookie: cookie.join('; ') },
      body: JSON.stringify({ pageSize: 200, ...(token ? { pageToken: token } : {}) }),
    });
    list.push(...(res.benchmarks ?? []));
    token = res.nextPageToken || undefined;
    if (!token) break;
  }
  if (token) r.note('stopped after 20 pages of 200');
  r.read(list.length);
  const cataloged = new Set(
    readJson<{ links?: Record<string, string>; evidence?: string[] }[]>(dataPath('benchmarks.json')).flatMap((b) =>
      [...Object.values(b.links ?? {}), ...(b.evidence ?? [])].flatMap((u) => u.match(/kaggle\.com\/benchmarks\/([\w-]+\/[\w-]+)/i)?.[1].toLowerCase() ?? []),
    ),
  );
  const byPath = new Map(list.flatMap((b) => (kagglePath(b) && kaggleMeetsBar(b) ? [[kagglePath(b)!, b] as const] : [])));
  const passing = [...byPath.keys()];
  // on the first run, the benchmarks published before the window count as seen
  const published = (p: string) => byPath.get(p)!.version?.publishTime ?? byPath.get(p)!.version?.createTime ?? '';
  const added = await r.fresh('kaggle', passing, async () => passing.filter((p) => published(p).slice(0, 10) < FROM));
  for (const path of added) {
    if (cataloged.has(path.toLowerCase())) continue;
    const b = byPath.get(path)!;
    const name = b.name!.trim();
    const desc = b.version?.description ?? '';
    const url = `${KAGGLE}/benchmarks/${path}`;
    const models = b.version?.leaderboardModelVersionsCount;
    r.add(
      {
        key: key(name),
        name,
        title: [desc || name, models ? `${models} models on its Kaggle board` : ''].filter(Boolean).join('. '),
        url,
        org: b.organization?.name ?? b.ownerUser?.displayName,
        stageA: 5,
        general: GENERAL.test(`${name} ${desc}`),
        niche: NICHE.test(`${name} ${desc}`),
      },
      { registry: { source: 'Kaggle Benchmarks', url } },
    );
  }
  r.remember('kaggle', passing);
}
