// Groups that build and run their own benchmarks: Vals AI, and Arena through its Hugging Face dataset.
import { key } from '../util.ts';
import { FROM, humanize, type Reader } from './core.ts';
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
