// Shared parts of the discovery job: the run window, the names already catalogued, Stage A and Stage B,
// the review store, and the reader handle that each source runs with.
import { existsSync } from 'node:fs';
import { dataPath, readJson, key, today, daysAgo } from '../util.ts';

export const DAYS = Number(process.argv[process.argv.indexOf('--days') + 1]) || 3;
export const TODAY = today();
export const FROM = daysAgo(DAYS);

export interface Source {
  source: string;
  url: string;
}
export interface Candidate {
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
export interface Store {
  updated: string | null;
  items: Candidate[];
  seen?: Record<string, string[]>;
}
export type Find = Partial<Candidate> & { key: string; name: string; title: string; url: string };
export interface How {
  feed?: string;
  curated?: Source;
  registry?: Source;
}

// ---- the registry, for telling new from known ----------------------------------------------------
const registry = readJson<{ id: string; name: string; aliases?: string[] }[]>(dataPath('benchmarks.json'));
const known = new Map<string, string>();
for (const b of registry) for (const n of [b.name, ...(b.aliases ?? [])]) if (key(n).length >= 3) known.set(key(n), b.id);

/** Spellings to try against the registry: "PostTrain Bench v1.1" is PostTrainBench 1.1, "LOCA-Bench 256K" is LOCA-Bench. */
export function spellings(name: string): string[] {
  const noV = name.replace(/\bv(?=\d)/gi, '');
  // a context length or sampling setting after the name
  const noSetting = noV.replace(/\s*[(,]?\s*\b(?:\d+(?:\.\d+)?[kKmM]|(?:pass|avg|maj|best|mean)@\d+|\d+-shot|zero-shot|few-shot)\)?\s*$/i, '').trim();
  // a patch release (1.0.6) belongs to its minor version, and version 1 is the original
  const minor = noSetting.replace(/(\d+\.\d+)\.\d+$/, '$1');
  const original = minor.replace(/[\s-]*(?:1|1\.0)$/, '');
  return [...new Set([name, noV, noSetting, minor, original].filter((s) => key(s).length >= 3))];
}
/** The registry id for a name, if the almanac already catalogues it. */
export function knownId(name: string): string | undefined {
  for (const s of spellings(name)) {
    const id = known.get(key(s));
    if (id) return id;
  }
  return undefined;
}

// ---- stage A ---------------------------------------------------------------------------------------
const NAME = /\b[\w.\-]*(?:Bench|BENCH|bench|Eval|EVAL|Arena|Gym|Exam|Leaderboard)[\w.\-]*\b/g;
export const BARE = /^(bench|benchmark|benchmarks|eval|evals|evaluation|arena|gym|exam|leaderboard|benchmarking)$/i;
const TITLE = /\b(benchmark(?:ing|s)?|leaderboard|evaluation suite|test ?bed|arena|gym)\b/i;
const INTRO =
  /\b(we|this (?:paper|work)) (?:also )?(?:introduce|present|propose|release|construct|build|curate|develop|create)s?\b[^.]{0,160}?\b(benchmark|evaluation suite|test ?bed|leaderboard|arena|eval(?:uation)? (?:set|framework|harness)|dataset)/i;
const METHOD = /\b(we propose a (?:novel )?(?:method|framework|approach|model|algorithm)|achiev\w+ state[- ]of[- ]the[- ]art|outperform\w*)\b/i;
const STUDY = /\b(we benchmark \d+|benchmarking study|empirical (?:benchmark )?study)\b/i;
export const GENERAL = /\b(LLMs?|language models?|agents?|agentic|VLMs?|MLLMs?|multimodal|foundation models?|coding|computer[- ]use|reasoning models?|frontier models?)\b/i;
export const NICHE = /\b(crowd counting|defect detection|pathology|fusion|hardware|FPGA|GPU kernel speed|segmentation of|remote sensing|shampoo|traffic sign)\b/i;
export const KNOWN_ORGS =
  /openai|anthropic|google|deepmind|meta|facebook|microsoft|nvidia|apple|amazon|alibaba|qwen|deepseek|moonshot|zhipu|z-ai|thudm|tencent|bytedance|salesforce|scale|epoch|metr|vals|lmarena|andon|aisi|allenai|ai2|huggingface|stanford|berkeley|princeton|mit|cmu|harvard|oxford|cambridge|tsinghua|peking|ucl|eth/i;
// names that end like a benchmark but are organizations or products
const NOT_BENCHMARKS = new Set(['lmarena', 'designarena', 'evalevalcoalition', 'openeval', 'everyevalever']);

/** Single-token benchmark names: "HackBench", "SWE-bench". The keyword must end the word, so "Example" does not count. */
export function names(text: string): string[] {
  const tail = /(Bench|BENCH|bench|Eval|EVAL|Evals|Arena|Gym|Exam|Leaderboard)(?![a-z])/;
  return [...new Set((text.match(NAME) ?? []).filter((n) => !BARE.test(n) && tail.test(n) && n.length >= 5 && /[A-Z]/.test(n) && !NOT_BENCHMARKS.has(key(n))))];
}

const LEAD = /^(?:the|a|an|our|new|this|that|its|their|his|her|my|your|every|each|any|some|first|latest|recent|public|private|frontier|hard|harder|own|in-house|internal)$/i;
/** Names of two to four words in running text: "Immigration Bench", "Furniture Assembly Benchmark". */
export function phraseNames(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/((?:[A-Z][\w'’.+-]*\s+){1,3})(Bench|Benchmark|Eval|Arena|Gym|Exam|Leaderboard)\b/g)) {
    const words = m[1].trim().split(/\s+/);
    while (words.length && LEAD.test(words[0])) words.shift();
    if (!words.length || words.every((w) => LEAD.test(w))) continue;
    const n = `${words.join(' ')} ${m[2]}`;
    if (n.length <= 40 && !NOT_BENCHMARKS.has(key(n))) out.add(n);
  }
  return [...out];
}

/** A paper's benchmark name: the part before the colon when it is short, else a Bench-style name, else the title. */
export function paperName(title: string): string {
  const head = title.split(':')[0].trim();
  if (head !== title && head.length <= 40 && head.split(/\s+/).length <= 4) return head;
  return names(title)[0] ?? title;
}

export function stageA(title: string, abstract: string, hasArtifact: boolean): number {
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

const PLACEHOLDER = /\b(test|tests|testing|demo|example|sample|toy|smoke|dummy|stub|victim|tmp|temp|hello|debug|scratch|wip|playground|my[-_]?first)\b/i;
/** Stage A for an entry on a hub of runnable task sets (Harbor, Prime Intellect), from its slug and description. */
export function hubStageA(slug: string, description: string): number {
  const name = slug.replace(/[-_]+/g, ' ');
  let s = 1; // the hub packages it with a verifier, so it runs
  if (/bench|eval|arena|gym|exam|leaderboard/i.test(slug)) s += 3;
  if (/\b(benchmark|evaluation|evals?|leaderboard|test set|held-out|tasks?)\b/i.test(description)) s += 2;
  if (/\b\d[\d,.]*k?\s+(?:[\w/-]+\s+){0,5}(?:tasks|problems|questions|environments|challenges|scenarios|instances)\b/i.test(description)) s += 1;
  if (PLACEHOLDER.test(name) || /\b(stubbed|placeholder|do not use|scratch)\b/i.test(description) || description.trim().length < 25) s -= 5;
  return s;
}

// ---- stage B ---------------------------------------------------------------------------------------
export function stageB(c: Candidate): number {
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

// ---- store -----------------------------------------------------------------------------------------
export const storePath = dataPath('discovered.json');
const store: Store = existsSync(storePath) ? readJson<Store>(storePath) : { updated: null, items: [] };
/** Lists from the last run of each registry, for telling a new entry from one already seen. */
export const seen: Record<string, string[]> = store.seen ?? {};
export const byKey = new Map<string, Candidate>();
for (const c of store.items) {
  byKey.set(c.key, c);
  if (!byKey.has(key(c.name))) byKey.set(key(c.name), c);
}

/** Adds a find to the queue, or more evidence to a find already there. Names already catalogued are skipped. */
function upsert(c: Find, how: How): { known: string } | { candidate: Candidate } {
  const k = knownId(c.name);
  if (k) return { known: k };
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
  return { candidate: cur };
}

// ---- readers ---------------------------------------------------------------------------------------
const UA = 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)';
export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  /** Milliseconds for one attempt. */
  timeout?: number;
  tries?: number;
}

/** What one source reported in this run. */
export interface Tally {
  read: number;
  candidates: number;
  known: number;
  notes: string[];
}

/**
 * The handle a reader runs with. Its requests stop when the reader's time is up, and finds that arrive
 * after that are dropped, so a slow source cannot hold up the run or write a half-read list to the store.
 */
export function makeReader(id: string, signal: AbortSignal) {
  const cands = new Set<Candidate>();
  const knownIds = new Set<string>();
  const tally: Tally = { read: 0, candidates: 0, known: 0, notes: [] };
  const remembered: Record<string, string[]> = {};
  let open = true;

  async function request(url: string, o: FetchOptions = {}): Promise<Response> {
    let last: unknown;
    for (let i = 0; i < (o.tries ?? 2); i++) {
      if (signal.aborted) break;
      try {
        const res = await fetch(url, {
          method: o.method,
          body: o.body,
          headers: { 'user-agent': UA, ...(o.headers ?? {}) },
          signal: AbortSignal.any([signal, AbortSignal.timeout(o.timeout ?? 45_000)]),
        });
        if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status} from ${url}`);
        if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} from ${url}`), { fatal: true });
        return res;
      } catch (e) {
        last = e;
        if ((e as { fatal?: boolean }).fatal || signal.aborted) break;
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      }
    }
    throw last ?? new Error(`stopped before ${url}`);
  }

  return {
    id,
    signal,
    tally,
    request,
    text: async (url: string, o?: FetchOptions) => (await request(url, o)).text(),
    json: async <T>(url: string, o?: FetchOptions) => (await (await request(url, o)).json()) as T,
    bytes: async (url: string, o?: FetchOptions) => Buffer.from(await (await request(url, o)).arrayBuffer()),
    /** Counts items read from the source, found or not. */
    read(n = 1) {
      tally.read += n;
    },
    note(s: string) {
      tally.notes.push(s);
    },
    /** Records a find with its attribution (feed, curated or registry). */
    add(c: Find, how: How) {
      if (!open) return;
      const r = upsert(c, how);
      if ('known' in r) knownIds.add(r.known);
      else cands.add(r.candidate);
      tally.candidates = cands.size;
      tally.known = knownIds.size;
    },
    /**
     * Entries that are new since the last run. On a source's first run there is no stored list, so
     * `before` supplies the entries it had at the start of the window. Without it, the first run only
     * records a baseline. Call `remember` once the new entries are added.
     */
    async fresh(name: string, ids: string[], before?: () => Promise<string[]>): Promise<string[]> {
      let prev = seen[name];
      if (!prev) {
        prev = ids;
        if (before)
          try {
            prev = await before();
          } catch (e) {
            tally.notes.push(`no history for a first-run baseline (${(e as Error).message})`);
          }
        else tally.notes.push('first run: recorded a baseline');
      }
      const old = new Set(prev);
      return ids.filter((x) => !old.has(x));
    },
    remember(name: string, ids: string[]) {
      if (ids.length) remembered[name] = ids;
    },
    /** Ends the reader. Lists are stored only when it finished in time. */
    close(finished: boolean) {
      open = false;
      if (finished) Object.assign(seen, remembered);
    },
  };
}
export type Reader = ReturnType<typeof makeReader>;

// ---- small helpers ---------------------------------------------------------------------------------
export const isoDate = (s: string | undefined | null): string => {
  const d = new Date(s ?? '');
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};
export const inWindow = (date: string) => date >= FROM && date <= TODAY;
/** "agent_bash_reliability" to "Agent Bash Reliability". */
export const humanize = (slug: string) => slug.replace(/[_]+/g, ' ').replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
export const arxivId = (url: string) => url.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/)?.[1];
export const githubRepo = (url: string) => url.match(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/)?.[0].replace(/\.git$/, '');
