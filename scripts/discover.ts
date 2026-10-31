// Finds new benchmarks and writes data/discovered.json, a review queue.
//
// Feeds (all official endpoints, read within their terms):
//   Hugging Face Daily Papers, the arXiv API, the AINews RSS feed (Latent Space), Epoch AI's benchmark
//   metadata, the Inspect Evals register, and Hugging Face datasets tagged benchmark:official.
// X is left out on purpose: its terms ban scraping. Artificial Analysis data is never imported.
//
// Scoring follows a two-stage rule measured on the week of 2026-10-25:
//   Stage A asks whether an item is a new benchmark at all (precision 0.91 at 5 points or more).
//   Stage B sums evidence across sources. 8 points or more: catalogue it. 5 to 7: watch it for 14 days.
// Names already in data/benchmarks.json become "mentions" of that benchmark instead of candidates.
//
// usage: node scripts/discover.ts [--days 3]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dataPath, readJson, writeJson, key, fetchText, fetchJson, today, daysAgo, githubHeaders } from './lib/util.ts';

const DAYS = Number(process.argv[process.argv.indexOf('--days') + 1]) || 3;
const TODAY = today();
const FROM = daysAgo(DAYS);

interface Source {
  source: string;
  url: string;
}
interface Candidate {
  key: string;
  name: string;
  title: string;
  url: string;
  first: string;
  last: string;
  org?: string;
  repo?: string;
  arxiv?: string;
  upvotes?: number;
  stars?: number;
  feeds: string[];
  curated: Source[];
  registries: Source[];
  stageA: number;
  general: boolean;
  niche: boolean;
  score: number;
  decision: 'catalogue' | 'watch';
}
interface Mention {
  benchmark: string;
  source: string;
  url: string;
  date: string;
}
interface Store {
  updated: string | null;
  items: Candidate[];
  mentions?: Mention[];
  seen?: Record<string, string[]>;
}

// ---- the registry, for telling new from known ----------------------------------------------------
const registry = readJson<{ id: string; name: string; aliases?: string[] }[]>(dataPath('benchmarks.json'));
const known = new Map<string, string>();
for (const b of registry) for (const n of [b.name, ...(b.aliases ?? [])]) if (key(n).length >= 3) known.set(key(n), b.id);

// ---- stage A ---------------------------------------------------------------------------------------
const NAME = /\b[\w.\-]*(?:Bench|BENCH|bench|Eval|EVAL|Arena|Gym|Exam|Leaderboard)[\w.\-]*\b/g;
const BARE = /^(bench|benchmark|benchmarks|eval|evals|evaluation|arena|gym|exam|leaderboard|benchmarking)$/i;
const TITLE = /\b(benchmark(?:ing|s)?|leaderboard|evaluation suite|test ?bed|arena|gym)\b/i;
const INTRO =
  /\b(we|this (?:paper|work)) (?:also )?(?:introduce|present|propose|release|construct|build|curate|develop|create)s?\b[^.]{0,160}?\b(benchmark|evaluation suite|test ?bed|leaderboard|arena|eval(?:uation)? (?:set|framework|harness)|dataset)/i;
const METHOD = /\b(we propose a (?:novel )?(?:method|framework|approach|model|algorithm)|achiev\w+ state[- ]of[- ]the[- ]art|outperform\w*)\b/i;
const STUDY = /\b(we benchmark \d+|benchmarking study|empirical (?:benchmark )?study)\b/i;
const GENERAL = /\b(LLMs?|language models?|agents?|agentic|VLMs?|MLLMs?|multimodal|foundation models?|coding|computer[- ]use|reasoning models?|frontier models?)\b/i;
const NICHE = /\b(crowd counting|defect detection|pathology|fusion|hardware|FPGA|GPU kernel speed|segmentation of|remote sensing|shampoo|traffic sign)\b/i;
const KNOWN_ORGS =
  /openai|anthropic|google|deepmind|meta|facebook|microsoft|nvidia|apple|amazon|alibaba|qwen|deepseek|moonshot|zhipu|z-ai|thudm|tencent|bytedance|salesforce|scale|epoch|metr|vals|lmarena|andon|aisi|allenai|ai2|huggingface|stanford|berkeley|princeton|mit|cmu|harvard|oxford|cambridge|tsinghua|peking|ucl|eth/i;

function names(text: string): string[] {
  // the keyword must end the word ("HackBench", "SWE-bench"), so "Example" and "Evaluating" do not count
  const tail = /(Bench|BENCH|bench|Eval|EVAL|Evals|Arena|Gym|Exam|Leaderboard)(?![a-z])/;
  return [...new Set((text.match(NAME) ?? []).filter((n) => !BARE.test(n) && tail.test(n) && n.length >= 5 && /[A-Z]/.test(n)))];
}

/** A paper's benchmark name: the part before the colon when it is short, else a Bench-style name, else the title. */
function paperName(title: string): string {
  const head = title.split(':')[0].trim();
  if (head !== title && head.length <= 40 && head.split(/\s+/).length <= 4) return head;
  return names(title)[0] ?? title;
}

function stageA(title: string, abstract: string, hasArtifact: boolean): number {
  let s = 0;
  const titleNames = names(title);
  if (titleNames.length) s += 3;
  if (TITLE.test(title)) s += 2;
  const intro = abstract.match(INTRO);
  if (intro) {
    s += 3;
    if (names(intro[0]).length) s += 1;
  }
  if (hasArtifact) s += 1;
  if (METHOD.test(abstract) && !intro && !TITLE.test(title) && !titleNames.length) s -= 2;
  if (STUDY.test(abstract)) s -= 2;
  return s;
}

// ---- store -----------------------------------------------------------------------------------------
const storePath = dataPath('discovered.json');
const store: Store = existsSync(storePath) ? readJson<Store>(storePath) : { updated: null, items: [] };
const seen = store.seen ?? {};
const firstRun = !store.seen;
const byKey = new Map(store.items.map((c) => [c.key, c]));
const mentions: Mention[] = (store.mentions ?? []).filter((m) => m.date >= daysAgo(45));

function upsert(c: Partial<Candidate> & { key: string; name: string; title: string; url: string }, how: { feed?: string; curated?: Source; registry?: Source }) {
  const k = known.get(key(c.name));
  if (k) {
    const src = how.curated ?? how.registry ?? { source: how.feed ?? 'feed', url: c.url };
    if (!mentions.some((m) => m.benchmark === k && m.url === src.url)) mentions.push({ benchmark: k, source: src.source, url: src.url, date: TODAY });
    return;
  }
  const cur =
    byKey.get(c.key) ??
    byKey.get(key(c.name)) ??
    ({ key: c.key, name: c.name, title: c.title, url: c.url, first: TODAY, last: TODAY, feeds: [], curated: [], registries: [], stageA: 0, general: false, niche: false, score: 0, decision: 'watch' } as Candidate);
  cur.last = TODAY;
  if (c.org) cur.org = c.org;
  if (c.repo) cur.repo = c.repo;
  if (c.arxiv) cur.arxiv = c.arxiv;
  if (c.upvotes !== undefined) cur.upvotes = c.upvotes;
  if (c.stars !== undefined) cur.stars = c.stars;
  cur.stageA = Math.max(cur.stageA, c.stageA ?? 0);
  cur.general ||= !!c.general;
  cur.niche ||= !!c.niche;
  if (how.feed && !cur.feeds.includes(how.feed)) cur.feeds.push(how.feed);
  if (how.curated && !cur.curated.some((s) => s.url === how.curated!.url)) cur.curated.push(how.curated);
  if (how.registry && !cur.registries.some((s) => s.source === how.registry!.source)) cur.registries.push(how.registry);
  byKey.set(cur.key, cur);
  if (key(cur.name) !== cur.key) byKey.set(key(cur.name), cur);
}

// ---- feeds -----------------------------------------------------------------------------------------
const log = (...a: unknown[]) => console.log(...a);

async function hfDailyPapers() {
  type P = { paper: { id: string; title: string; summary: string; upvotes?: number; githubRepo?: string; githubStars?: number; organization?: { name?: string; fullname?: string } }; title?: string; summary?: string };
  let n = 0;
  for (let d = 0; d <= DAYS; d++) {
    const date = daysAgo(d);
    const list = await fetchJson<P[]>(`https://huggingface.co/api/daily_papers?date=${date}&limit=100`).catch(() => [] as P[]);
    for (const it of list) {
      const p = it.paper;
      const title = it.title ?? p.title;
      const abs = it.summary ?? p.summary ?? '';
      const a = stageA(title, abs, !!p.githubRepo);
      if (a < 5) continue;
      const nm = paperName(title);
      n++;
      upsert(
        {
          key: p.id,
          name: nm,
          title,
          url: `https://huggingface.co/papers/${p.id}`,
          arxiv: p.id,
          org: p.organization?.fullname ?? p.organization?.name,
          repo: p.githubRepo,
          upvotes: p.upvotes,
          stars: p.githubStars,
          stageA: a,
          general: GENERAL.test(`${title} ${abs}`),
          niche: NICHE.test(`${title} ${abs}`),
        },
        { feed: 'hf' },
      );
    }
  }
  log(`  Hugging Face Daily Papers: ${n} benchmark papers`);
}

async function arxiv() {
  const q = `(ti:benchmark OR abs:benchmark) AND (cat:cs.CL OR cat:cs.AI OR cat:cs.LG OR cat:cs.SE) AND submittedDate:[${FROM.replace(/-/g, '')}0000 TO ${TODAY.replace(/-/g, '')}2359]`;
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(q)}&sortBy=submittedDate&sortOrder=descending&max_results=500`;
  const xml = await fetchText(url).catch((e) => (log(`  arXiv failed: ${e}`), ''));
  const text = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  let n = 0;
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const id = (e.match(/<id>https?:\/\/arxiv\.org\/abs\/([^<v]+)/) ?? [])[1];
    const title = text((e.match(/<title>([\s\S]*?)<\/title>/) ?? [])[1] ?? '');
    const abs = text((e.match(/<summary>([\s\S]*?)<\/summary>/) ?? [])[1] ?? '');
    if (!id || !title) continue;
    const artifact = /github\.com|huggingface\.co\/datasets/.test(e);
    const a = stageA(title, abs, artifact);
    if (a < 5) continue;
    n++;
    const repo = (abs.match(/https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/) ?? [])[0]?.replace(/[.)]+$/, '');
    upsert(
      { key: id, name: paperName(title), title, url: `https://arxiv.org/abs/${id}`, arxiv: id, repo, stageA: a, general: GENERAL.test(`${title} ${abs}`), niche: NICHE.test(`${title} ${abs}`) },
      { feed: 'arxiv' },
    );
  }
  log(`  arXiv: ${n} benchmark papers`);
}

async function ainews() {
  // AINews (Latent Space) names new evals in its recap, with a link to the announcement.
  const xml = await fetchText('https://latent.space/feeds/news.xml').catch((e) => (log(`  AINews failed: ${e}`), ''));
  let n = 0;
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const date = new Date((it.match(/<pubDate>([^<]+)<\/pubDate>/) ?? [])[1] ?? '').toISOString().slice(0, 10);
    if (date < FROM) continue;
    const link = (it.match(/<link>([^<]+)<\/link>/) ?? [])[1] ?? 'https://latent.space/news';
    const html = (it.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/) ?? it.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ?? [])[1] ?? '';
    // each bullet runs from its <li> to the next <li> or </li>, so nested lists do not swallow bullets
    for (const li of html.matchAll(/<li[^>]*>([\s\S]*?)(?=<li[\s>]|<\/li>)/g)) {
      const body = li[1];
      // a launch bullet opens with the bold name: "<b>BallotBench</b>: Nine agents..." or "<b>HackBench (Meta).</b> ..."
      const lead = body.match(/^\s*(?:<p>)?\s*<(strong|b)>([^<]{3,60})<\/\1>/);
      if (!lead) continue;
      const bold = lead[2].replace(/\s*\([^)]*\)\s*/g, ' ').replace(/[.:\s]+$/, '').trim();
      const nm = /(Bench|bench|Eval|Evals|Arena|Gym|Exam|Leaderboard)(?![a-z])/.test(bold) && !BARE.test(bold) && bold.length <= 40 ? bold : names(bold)[0];
      if (!nm) continue;
      const plain = body.replace(/<[^>]+>/g, ' ');
      const before = html.slice(Math.max(0, (li.index ?? 0) - 2000), li.index ?? 0);
      const launch = /\b(introduc|launch|releas|new\b|announc|open-sourc|unveil|debut)/i.test(plain);
      const evalsHeading = /<(?:strong|b)>[^<]*\b(evals?|benchmarks?)\b[^<]*<\/(?:strong|b)>[^<]{0,4}(?:<\/p>)?\s*<ul/i.test(before);
      if (!launch && !evalsHeading) continue;
      const href = (body.match(/href="(https?:\/\/[^"]+)"/) ?? [])[1]?.replace(/[?&]utm_[^"]*$/, '').replace(/&amp;/g, '&') ?? link;
      n++;
      upsert({ key: key(nm), name: nm, title: nm, url: href, stageA: 5, general: true }, { curated: { source: 'AINews', url: link } });
    }
  }
  log(`  AINews: ${n} named evals`);
}

async function epochHub() {
  const dir = mkdtempSync(join(tmpdir(), 'epoch-'));
  const zip = join(dir, 'b.zip');
  const res = await fetch('https://epoch.ai/data/benchmark_data.zip', { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) return log(`  Epoch failed: ${res.status}`);
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  const csv = execFileSync('unzip', ['-p', zip, 'benchmark_metadata.csv']).toString();
  const rows = csv.split('\n').slice(1).map((l: string) => l.split(',')[0]).filter(Boolean);
  const prev = new Set(seen.epoch ?? []);
  let n = 0;
  for (const name of rows) {
    if (prev.has(name) || firstRun) continue;
    n++;
    upsert({ key: key(name), name, title: name, url: 'https://epoch.ai/benchmarks', stageA: 5, general: true }, { registry: { source: 'Epoch AI', url: 'https://epoch.ai/benchmarks' } });
  }
  seen.epoch = rows;
  log(`  Epoch AI: ${rows.length} benchmarks, ${n} new`);
}

async function inspectEvals() {
  type Entry = { name: string; type: string; html_url: string };
  const list = await fetchJson<Entry[]>('https://api.github.com/repos/UKGovernmentBEIS/inspect_evals/contents/register', { headers: githubHeaders() }).catch(() => [] as Entry[]);
  const dirs = list.filter((e) => e.type === 'dir').map((e) => e.name);
  const prev = new Set(seen.inspect ?? []);
  let n = 0;
  for (const d of dirs) {
    if (prev.has(d) || firstRun) continue;
    n++;
    upsert({ key: key(d), name: d, title: d, url: `https://github.com/UKGovernmentBEIS/inspect_evals/tree/main/register/${d}`, stageA: 5, general: true }, { registry: { source: 'Inspect Evals', url: 'https://github.com/UKGovernmentBEIS/inspect_evals' } });
  }
  if (dirs.length) seen.inspect = dirs;
  log(`  Inspect Evals: ${dirs.length} evals, ${n} new`);
}

async function hfOfficial() {
  type D = { id: string; createdAt?: string };
  const list = await fetchJson<D[]>('https://huggingface.co/api/datasets?filter=benchmark:official&sort=createdAt&direction=-1&limit=100').catch(() => [] as D[]);
  const ids = list.map((d) => d.id);
  const prev = new Set(seen.hfOfficial ?? []);
  let n = 0;
  for (const id of ids) {
    if (prev.has(id) || firstRun) continue;
    n++;
    const nm = id.split('/')[1] ?? id;
    upsert({ key: key(nm), name: nm, title: id, url: `https://huggingface.co/datasets/${id}`, org: id.split('/')[0], stageA: 5, general: true }, { registry: { source: 'Hugging Face benchmark datasets', url: `https://huggingface.co/datasets/${id}` } });
  }
  if (ids.length) seen.hfOfficial = ids;
  log(`  Hugging Face benchmark datasets: ${ids.length}, ${n} new`);
}

async function githubStars(cands: Candidate[]) {
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) return;
  for (const c of cands) {
    const m = c.repo?.match(/github\.com\/([\w.-]+\/[\w.-]+)/);
    if (!m) continue;
    const r = await fetchJson<{ stargazers_count?: number }>(`https://api.github.com/repos/${m[1].replace(/\.git$/, '')}`, { headers: githubHeaders() }).catch(() => null);
    if (r?.stargazers_count !== undefined) c.stars = r.stargazers_count;
  }
}

// ---- stage B ---------------------------------------------------------------------------------------
function stageB(c: Candidate): number {
  let s = 0;
  if (c.stageA >= 5) s += 3;
  if (c.repo || c.url.includes('huggingface.co/datasets') || c.curated.length) s += 2;
  if (c.general) s += 2;
  if (c.niche) s -= 3;
  if (KNOWN_ORGS.test(`${c.org ?? ''} ${c.repo ?? ''}`)) s += 2;
  if ((c.upvotes ?? 0) >= 20 || (c.stars ?? 0) >= 25) s += 2;
  if (new Set(c.feeds).size >= 2) s += 2;
  if (c.curated.length) s += 4;
  if (c.registries.length) s += 6;
  return s;
}

// ---- run -------------------------------------------------------------------------------------------
log(`Discovering benchmarks from ${FROM} to ${TODAY}${firstRun ? ' (first run: registries record a baseline)' : ''}`);
const results = await Promise.allSettled([hfDailyPapers(), arxiv(), ainews(), epochHub(), inspectEvals(), hfOfficial()]);
for (const r of results) if (r.status === 'rejected') log(`  feed failed: ${r.reason}`);

const all = [...new Set(byKey.values())];
await githubStars(all.filter((c) => c.last === TODAY && !c.stars));
const items = all
  .map((c) => {
    c.score = stageB(c);
    c.decision = c.score >= 8 ? 'catalogue' : 'watch';
    return c;
  })
  // watch items leave after 14 quiet days, catalogue items after 60 or once they join the registry
  .filter((c) => c.score >= 5 && !known.has(key(c.name)) && c.last >= daysAgo(c.decision === 'catalogue' ? 60 : 14))
  .sort((a, b) => Number(b.decision === 'catalogue') - Number(a.decision === 'catalogue') || b.score - a.score || b.last.localeCompare(a.last));

const out: Store = { updated: TODAY, items, mentions: mentions.sort((a, b) => b.date.localeCompare(a.date)), seen };
writeJson(storePath, out);
const cat = items.filter((c) => c.decision === 'catalogue').length;
log(`Wrote ${items.length} candidates (${cat} to catalogue, ${items.length - cat} on the watch list) and ${out.mentions!.length} mentions of known benchmarks.`);
