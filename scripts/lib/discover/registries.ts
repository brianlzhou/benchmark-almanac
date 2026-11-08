// Registries and hubs: lists where a new entry is a benchmark someone has packaged or chosen to run.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { key, githubHeaders, readJson, dataPath, daysAgo } from '../util.ts';
import { FROM, GENERAL, NICHE, knownId, names, hubStageA, humanize, arxivId, githubRepo, type Reader } from './core.ts';

export async function epochHub(r: Reader) {
  const zipBytes = await r.bytes('https://epoch.ai/data/benchmark_data.zip', { timeout: 100_000 });
  const dir = mkdtempSync(join(tmpdir(), 'epoch-'));
  const zip = join(dir, 'b.zip');
  writeFileSync(zip, zipBytes);
  const csv = execFileSync('unzip', ['-p', zip, 'benchmark_metadata.csv']).toString();
  rmSync(dir, { recursive: true, force: true });
  const rows = csv.split('\n').slice(1).map((l: string) => l.split(',')[0]).filter(Boolean);
  r.read(rows.length);
  for (const name of await r.fresh('epoch', rows))
    r.add({ key: key(name), name, title: name, url: 'https://epoch.ai/benchmarks', stageA: 5, general: true }, { registry: { source: 'Epoch AI', url: 'https://epoch.ai/benchmarks' } });
  r.remember('epoch', rows);
}

export async function inspectEvals(r: Reader) {
  type Entry = { name: string; type: string };
  const list = await r.json<Entry[]>('https://api.github.com/repos/UKGovernmentBEIS/inspect_evals/contents/register', { headers: githubHeaders() });
  const dirs = list.filter((e) => e.type === 'dir').map((e) => e.name);
  r.read(dirs.length);
  for (const d of await r.fresh('inspect', dirs))
    r.add(
      { key: key(d), name: d, title: d, url: `https://github.com/UKGovernmentBEIS/inspect_evals/tree/main/register/${d}`, stageA: 5, general: true },
      { registry: { source: 'Inspect Evals', url: 'https://github.com/UKGovernmentBEIS/inspect_evals' } },
    );
  r.remember('inspect', dirs);
}

export async function hfOfficial(r: Reader) {
  type D = { id: string };
  const list = await r.json<D[]>('https://huggingface.co/api/datasets?filter=benchmark:official&sort=createdAt&direction=-1&limit=100');
  const ids = list.map((d) => d.id);
  r.read(ids.length);
  for (const id of await r.fresh('hfOfficial', ids)) {
    const nm = id.split('/')[1] ?? id;
    r.add(
      { key: key(nm), name: nm, title: id, url: `https://huggingface.co/datasets/${id}`, org: id.split('/')[0], stageA: 5, general: true },
      { registry: { source: 'Hugging Face benchmark datasets', url: `https://huggingface.co/datasets/${id}` } },
    );
  }
  r.remember('hfOfficial', ids);
}

/** The name a hub entry gives itself: "ExtractBench Pro: 100 synthetic..." for the slug extractbench-pro. */
function hubName(slug: string, description: string): string {
  const k = key(slug.replace(/[-_]v?\d+(?:\.\d+)*$/i, ''));
  const head = description.split(/[:.(—–]/)[0].trim();
  if (head.length <= 40 && key(head).startsWith(k.slice(0, Math.max(4, k.length - 2)))) return head;
  return names(description).find((n) => key(n) === k || key(n).startsWith(k) || k.startsWith(key(n))) ?? slug;
}

// Harbor Hub, the task-set registry from the Terminal-Bench team. Its terms have no clause against reading
// the public listing. This is the read-only query its open-source CLI makes, with the publishable key the
// CLI ships (src/harbor/auth/constants.py in harbor-framework/harbor).
const HARBOR = 'https://ofhuhcpkvzjlejydnvyd.supabase.co/rest/v1';
const HARBOR_KEY = 'sb_publishable_Z-vuQbpvpG-PStjbh4yE0Q_e-d3MTIH';
export async function harbor(r: Reader) {
  type V = { version: string; description: string | null; published_at: string | null; yanked_at: string | null };
  type P = { name: string; created_at: string; org: { name: string } | null; dataset_version: V[] };
  const q = `select=name,created_at,org:org_id(name),dataset_version(version,description,published_at,yanked_at)&type=eq.dataset&visibility=eq.public&is_temporary=eq.false&created_at=gte.${FROM}&order=created_at.desc&limit=500`;
  const list = await r.json<P[]>(`${HARBOR}/package?${q}`, { headers: { apikey: HARBOR_KEY, authorization: `Bearer ${HARBOR_KEY}` } });
  r.read(list.length);
  for (const p of list) {
    const live = p.dataset_version.filter((v) => !v.yanked_at).sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
    if (!live.length || !p.org) continue;
    const desc = live[0].description ?? '';
    // test uploads and vague entries stay out; the listing is open to anyone with an account
    if (hubStageA(`${p.org.name} ${p.name}`, desc) < 5) continue;
    const url = `https://hub.harborframework.com/datasets/${p.org.name}/${p.name}`;
    const nm = hubName(p.name, desc);
    r.add(
      { key: key(nm), name: nm, title: desc.slice(0, 160) || nm, url, repo: url, org: p.org.name, stageA: 5, general: GENERAL.test(desc) || /agent|terminal|task/i.test(desc), niche: NICHE.test(desc) },
      { registry: { source: 'Harbor Hub', url } },
    );
  }
}

// Prime Intellect's Environments Hub. Anyone can publish, and most entries are training environments, so
// a find here counts as one feed: it needs a second source or a known maker to reach the catalog list.
// This is the public listing call its official CLI makes (`prime env list`), with no account.
export async function primeHub(r: Reader) {
  type E = { name: string; description: string | null; owner: { name: string; type: string } | null; created_at: string; tags: string[] | null; stars: number; visibility: string };
  const list: E[] = [];
  for (let offset = 0; offset < 500; offset += 100) {
    const page = await r.json<{ data: E[] }>(`https://api.primeintellect.ai/api/v1/environmentshub/?include_teams=true&limit=100&offset=${offset}&sort_by=created_at&sort_order=desc`);
    list.push(...page.data);
    if (page.data.length < 100 || page.data.at(-1)!.created_at.slice(0, 10) < FROM) break;
  }
  const recent = list.filter((e) => e.created_at.slice(0, 10) >= FROM && e.visibility === 'PUBLIC' && e.owner);
  r.read(recent.length);
  for (const e of recent) {
    const desc = e.description ?? '';
    const tags = (e.tags ?? []).join(' ');
    const benchLike = /bench|eval|arena|gym|exam|leaderboard/i.test(e.name) || /\bbenchmark\b/i.test(tags);
    const a = hubStageA(e.name, desc) + (/\bbenchmark\b/i.test(tags) ? 2 : 0);
    if (!benchLike || a < 5) continue;
    const url = `https://app.primeintellect.ai/dashboard/environments/${e.owner!.name}/${e.name}`;
    const nm = hubName(e.name, desc);
    r.add(
      { key: key(nm), name: nm, title: desc.slice(0, 160) || nm, url, repo: url, org: e.owner!.name, stars: e.stars, stageA: a, general: GENERAL.test(`${desc} ${tags}`) || /agent|coding|tool/i.test(tags), niche: NICHE.test(desc) },
      { feed: 'Prime Intellect hub' },
    );
  }
}

/** Hugging Face folder names at the newest commit made before the window opened. */
async function hfFoldersBefore(r: Reader, repo: string, path: string): Promise<string[]> {
  type C = { id: string; date: string };
  const commits = await r.json<C[]>(`https://huggingface.co/api/datasets/${repo}/commits/main?limit=1000`, { timeout: 60_000 });
  const base = commits.find((c) => c.date.slice(0, 10) < FROM);
  if (!base) throw new Error(`no commit before ${FROM}`);
  const tree = await r.json<{ type: string; path: string }[]>(`https://huggingface.co/api/datasets/${repo}/tree/${base.id}/${path}`);
  return tree.filter((t) => t.type === 'directory').map((t) => t.path.split('/').pop()!);
}

// Every Eval Ever: a shared store of eval results (MIT). Each data/<collection> folder is one benchmark.
// Folders named for an aggregator rather than a benchmark are left out.
const AGGREGATORS = /artificial[-_]analysis|llm[-_]stats|paperswithcode|^openeval$|^vals[-_]ai$|^wild$|^arena$|^benchpress$|^exgentic$|leaderboard$/i;
export async function everyEvalEver(r: Reader) {
  const REPO = 'evaleval/EEE_datastore';
  const tree = await r.json<{ type: string; path: string }[]>(`https://huggingface.co/api/datasets/${REPO}/tree/main/data`);
  const folders = tree.filter((t) => t.type === 'directory').map((t) => t.path.split('/').pop()!);
  r.read(folders.length);
  for (const f of await r.fresh('everyEvalEver', folders, () => hfFoldersBefore(r, REPO, 'data'))) {
    if (AGGREGATORS.test(f)) continue;
    // "hal-gaia" is GAIA run on the HAL leaderboard, "helm_mmlu" is MMLU in HELM
    const base = f.replace(/^(hal|helm)[-_]/i, '');
    const nm = knownId(base) ? base : f;
    const url = `https://huggingface.co/datasets/${REPO}/tree/main/data/${f}`;
    r.add({ key: key(nm), name: nm, title: `${f} in Every Eval Ever`, url, stageA: 5, general: true }, { registry: { source: 'Every Eval Ever', url } });
  }
  r.remember('everyEvalEver', folders);
}

// VLMEvalKit, OpenCompass's multimodal toolkit (Apache-2.0). Each module under vlmeval/dataset adds support
// for a benchmark. Read through the GitHub API, which github.com/robots.txt points crawlers to.
const VLM = 'https://api.github.com/repos/open-compass/VLMEvalKit';
const VLM_HELPERS = /^(__init__|utils?|.*_base|image_\w+|video_\w+|text_\w+|.*_config|.*_dataset)(\.py)?$/;
export async function vlmevalkit(r: Reader) {
  type F = { name: string; type: string };
  const gh = { headers: githubHeaders() };
  const list = (await r.json<F[]>(`${VLM}/contents/vlmeval/dataset`, gh)).map((f) => f.name).filter((n) => !VLM_HELPERS.test(n));
  r.read(list.length);
  const added = await r.fresh('vlmevalkit', list, async () => {
    const [base] = await r.json<{ sha: string }[]>(`${VLM}/commits?path=vlmeval/dataset&until=${FROM}T00:00:00Z&per_page=1`, gh);
    return (await r.json<F[]>(`${VLM}/contents/vlmeval/dataset?ref=${base.sha}`, gh)).map((f) => f.name);
  });
  for (const file of added.slice(0, 20)) {
    let nm = humanize(file.replace(/\.py$/, ''));
    if (file.endsWith('.py')) {
      // the module's DATASET_URL keys are the names VLMEvalKit runs it under; the shortest is the base set
      const src = await r.text(`${VLM}/contents/vlmeval/dataset/${file}`, { headers: { ...githubHeaders(), accept: 'application/vnd.github.raw' } }).catch(() => '');
      const block = src.match(/DATASET_URL\s*=\s*\{([\s\S]*?)\}/)?.[1] ?? '';
      const keys = [...block.matchAll(/["']([\w.+-]{3,40})["']\s*:/g)].map((m) => m[1]).sort((a, b) => a.length - b.length);
      const cls = src.match(/^class (\w+)\(/m)?.[1];
      nm = keys[0] ?? cls ?? nm;
    }
    const url = `https://github.com/open-compass/VLMEvalKit/blob/main/vlmeval/dataset/${file}`;
    r.add({ key: key(nm), name: nm, title: `${nm} in VLMEvalKit`, url, stageA: 5, general: true }, { registry: { source: 'VLMEvalKit', url } });
  }
  r.remember('vlmevalkit', list);
}

// awesome-ai-leaderboard (SAIL Research) and Awesome-CUA, read through the GitHub API.
const AAL = 'https://api.github.com/repos/SAILResearch/awesome-ai-leaderboard';
/** Rows in the README's model-ranking tables: "| [Name](url) | what it ranks |". */
function leaderboardRows(md: string): { name: string; url: string; desc: string }[] {
  const start = md.search(/^## Model Ranking/m);
  const end = md.search(/^## Database Ranking/m);
  const part = md.slice(Math.max(0, start), end > start ? end : undefined);
  return [...part.matchAll(/^\|\s*\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)\s*\|\s*([^|\n]*)/gm)].map((m) => ({ name: m[1].trim(), url: m[2], desc: m[3].trim() }));
}
export async function awesomeAiLeaderboard(r: Reader) {
  const raw = { headers: { ...githubHeaders(), accept: 'application/vnd.github.raw' } };
  const rows = leaderboardRows(await r.text(`${AAL}/readme`, raw));
  r.read(rows.length);
  const ids = rows.map((x) => x.url);
  const added = new Set(
    await r.fresh('awesomeAiLeaderboard', ids, async () => {
      const [base] = await r.json<{ sha: string }[]>(`${AAL}/commits?path=README.md&until=${FROM}T00:00:00Z&per_page=1`, { headers: githubHeaders() });
      return leaderboardRows(await r.text(`${AAL}/contents/README.md?ref=${base.sha}`, raw)).map((x) => x.url);
    }),
  );
  for (const x of rows) {
    if (!added.has(x.url)) continue;
    // sites that rank models across many benchmarks are not benchmarks themselves
    if (/\b(aggregat\w*|across (?:\d+|many|multiple|hundreds of|thousands of) benchmarks|thousands of models|pricing)\b/i.test(x.desc)) continue;
    // a row named like a benchmark counts as a listing; any other leaderboard needs a second source
    const benchLike = names(x.name).length > 0 || /\b(bench(mark)?|eval|arena|exam|gym)\b/i.test(x.name);
    r.add(
      { key: key(x.name), name: x.name, title: x.desc || x.name, url: x.url, repo: x.url.includes('github.com') ? x.url : undefined, stageA: 5, general: true, niche: NICHE.test(x.desc) },
      benchLike ? { registry: { source: 'awesome-ai-leaderboard', url: 'https://github.com/SAILResearch/awesome-ai-leaderboard' } } : { feed: 'awesome-ai-leaderboard' },
    );
  }
  r.remember('awesomeAiLeaderboard', ids);
}

// Awesome-CUA keeps dated records of computer-use benchmarks in data/catalog.jsonl.
export async function awesomeCua(r: Reader) {
  type Rec = { id: string; kind: string; name: string; url: string; summary: string | null; scope: string; review_status: string; evidence: { retrieved_at?: string }[]; links: { rel: string; url: string }[] };
  const text = await r.text('https://api.github.com/repos/reacher-z/Awesome-CUA/contents/data/catalog.jsonl', { headers: { ...githubHeaders(), accept: 'application/vnd.github.raw' }, timeout: 90_000 });
  const recs = text
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Rec)
    .filter((x) => x.kind === 'benchmark' && x.review_status === 'curated' && x.scope !== 'relevance_pending');
  r.read(recs.length);
  const ids = recs.map((x) => x.id);
  // on the first run, the date the scanner first recorded an entry sets the baseline
  const firstSeen = (x: Rec) => x.evidence.map((e) => e.retrieved_at ?? '').filter(Boolean).sort()[0] ?? '';
  const added = new Set(await r.fresh('awesomeCua', ids, async () => recs.filter((x) => firstSeen(x).slice(0, 10) < FROM).map((x) => x.id)));
  // Since 2026-11-06 the list curates old benchmarks and small personal repositories too: it added 127 in a day,
  // most with no stars. So an entry counts as one feed, not a registry listing, and it reaches the catalog list only
  // with stars or a second source. Its records carry no publication date, so the repository's creation date stands
  // in: an entry whose repository is more than 30 days old is not a launch and is skipped.
  const token = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  let lookups = token ? 300 : 40;
  let old = 0;
  for (const x of recs) {
    if (!added.has(x.id)) continue;
    const repo = githubRepo(x.links.find((l) => l.url.includes('github.com'))?.url ?? x.url);
    const created =
      repo && lookups-- > 0
        ? await r
            .json<{ created_at?: string }>(repo.replace('https://github.com/', 'https://api.github.com/repos/'), { headers: githubHeaders() })
            .then((d) => d.created_at?.slice(0, 10))
            .catch(() => undefined)
        : undefined;
    if (created && created < daysAgo(30)) {
      old++;
      continue;
    }
    r.add({ key: key(x.name), name: x.name, title: x.summary ?? x.name, url: x.url, repo, stageA: 5, general: true }, { feed: 'Awesome-CUA' });
  }
  if (old) r.note(`skipped ${old} older benchmark(s) the list newly curated`);
  r.remember('awesomeCua', ids);
}

// BenchmarkList (benchmarklist.com) catalogs about 2,600 benchmarks and publishes them as one JSON file in its
// public data API. Its robots.txt allows every path for general agents and signals "use=reference, ai-train=no".
// This reader is reference use: it takes each new entry's name and its own links (paper, repository, site) and
// checks nothing else. It copies no BenchmarkList text or scores, and it identifies itself as benchmark-almanac.
// One request a day. A find counts as one feed, so it needs a second source or a known maker to reach the catalog
// list. Entries whose only link is an arXiv paper are skipped (the arXiv reader sees those papers), and so are
// entries from Artificial Analysis, whose data the almanac never uses.
const BENCHMARKLIST = 'https://benchmarklist.com/api/v1/benchmarks.json';
interface BlEntry {
  id: string;
  name: string;
  source?: string | null;
  description?: string | null;
  links?: Record<string, string>;
  urls?: { page?: string };
}
export async function benchmarkList(r: Reader) {
  const { benchmarks } = await r.json<{ benchmarks: BlEntry[] }>(BENCHMARKLIST, { timeout: 90_000 });
  r.read(benchmarks.length);
  const ids = benchmarks.map((x) => x.id);
  // the first run records what is there today: those entries were compared with the catalog by hand on 2026-11-05
  const added = new Set(await r.fresh('benchmarkList', ids));
  for (const x of benchmarks) {
    if (!added.has(x.id) || /artificial[_\s-]?analysis/i.test(x.source ?? '')) continue;
    const links = Object.values(x.links ?? {}).filter((u) => /^https?:\/\//.test(u));
    if (!links.length || links.every((u) => /arxiv\.org/.test(u))) continue;
    const l = x.links ?? {};
    const repo = githubRepo(l.repository ?? links.find((u) => u.includes('github.com')) ?? '');
    const url = l.repository ?? l.leaderboard ?? l.homepage ?? l.blog ?? l.paper ?? l.dataset ?? links[0];
    const text = `${x.name} ${x.description ?? ''}`;
    r.add(
      { key: key(x.name), name: x.name, title: x.name, url, arxiv: arxivId(l.paper), repo, stageA: hubStageA(x.name, x.description ?? ''), general: GENERAL.test(text), niche: NICHE.test(text) },
      { feed: 'BenchmarkList' },
    );
  }
  r.remember('benchmarkList', ids);
}

/** Name patterns for models released in the last 18 months, with their labs, from data/models.json. */
let recent: { lab: string; re: RegExp }[] | undefined;
function recentModels() {
  if (recent) return recent;
  const cut = daysAgo(550);
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  recent = readJson<{ name: string; lab: string; released?: string }[]>(dataPath('models.json'))
    .filter((m) => (m.released ?? '') >= cut)
    .map((m) => {
      // results tables often drop the brand: "Opus 5.5" for Claude Opus 5.5
      const short = m.name.replace(/^(?:Claude|OpenAI|Google|Meta|xAI)\s+/, '');
      const alts = short !== m.name && short.length >= 6 && /\d/.test(short) ? [m.name, short] : [m.name];
      return { lab: m.lab, re: new RegExp(String.raw`(?<![\w.-])(?:${alts.map(esc).join('|')})(?![\w-]|\.\d)`, 'i') };
    });
  return recent;
}

/** How many current models, and from how many labs, the tables in a dataset card name. */
export function resultsModels(card: string): { models: number; labs: number } {
  const tables = card
    .split('\n')
    .filter((l) => /^\s*\|/.test(l))
    .join('\n');
  const hits = recentModels().filter((m) => m.re.test(tables));
  return { models: hits.length, labs: new Set(hits.map((m) => m.lab)).size };
}

// New Hugging Face datasets tagged "benchmark" whose card reports results for current models. About 60 datasets a
// day get the tag, most of them uploads with no results. A card table that names at least three current models
// from at least two labs marks a benchmark someone has run. Added 2026-11-05, after the scan missed ShadowBench,
// which Perpetual Research announced only on X and released as a dataset with its results. Over the three weeks
// before, this found about two datasets a day, from lab releases to personal projects, so a find counts as one
// feed: it goes to the watch list until a second source names it or the org is a known one.
export async function hfBenchmarkResults(r: Reader) {
  type D = { id: string; createdAt?: string };
  const list = (await r.json<D[]>('https://huggingface.co/api/datasets?filter=benchmark&sort=createdAt&direction=-1&limit=1000')).filter((d) => (d.createdAt ?? '').slice(0, 10) >= FROM);
  const ids = list.map((d) => d.id);
  // every dataset in the window is new on the first run, since the window itself bounds the work
  const fresh = await r.fresh('hfBenchmarkResults', ids, async () => []);
  for (const id of fresh) {
    // model outputs from a benchmark ("tale_suite_trajectories", "PAT-leaderboard-results") are not a new benchmark
    if (/[-_](?:trajector(?:y|ies)|traces?|outputs?|responses|generations|predictions|completions|logs?|results)$/i.test(id)) continue;
    const card = await r.text(`https://huggingface.co/datasets/${id}/raw/main/README.md`).catch(() => '');
    r.read();
    if (!card) continue;
    const { models, labs } = resultsModels(card);
    if (models < 3 || labs < 2) continue;
    const pretty = card.match(/^pretty_name:\s*["']?([^"'\n]+)/m)?.[1]?.trim();
    const heading = card.match(/^#\s+([^\n#]{3,40})$/m)?.[1]?.trim();
    let nm = (pretty?.replace(/\$/g, '') || undefined) ?? (heading && key(heading) === key(id.split('/')[1]) ? heading : undefined) ?? id.split('/')[1];
    // "LegalBench-ID (Indonesian Sovereign Legal Reasoning Benchmark)", "N1M19 (test_1018): VLM agents finding..."
    nm = nm.replace(/\s*\([^)]*\)/g, '').trim();
    if (nm.length > 40) nm = nm.split(/\s*[:—–]\s+/)[0];
    const url = `https://huggingface.co/datasets/${id}`;
    const text = card.replace(/^---[\s\S]*?---/, '').slice(0, 3000);
    r.add(
      { key: key(nm), name: nm, title: id, url, org: id.split('/')[0], stageA: 6, general: GENERAL.test(text), niche: NICHE.test(text) },
      { feed: 'Hugging Face datasets with results' },
    );
  }
  r.remember('hfBenchmarkResults', ids);
}
