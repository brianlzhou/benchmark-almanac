// Shared parts of the discovery job: the run window, the names already cataloged, Stage A and Stage B,
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
  decision: 'catalog' | 'watch';
  /** A cataloged benchmark with the same name that is a different test (Ai2's StateBench, Microsoft's STATE-Bench). */
  sameNameAs?: string;
}
export interface Store {
  updated: string | null;
  items: Candidate[];
  seen?: Record<string, string[]>;
  /** Papers that introduce a benchmark the almanac already catalogs without a paper link. */
  papers?: PaperFind[];
}
export interface PaperFind {
  /** The cataloged record the paper introduces. */
  benchmark: string;
  arxiv: string;
  title: string;
  url: string;
  source: string;
  first: string;
  last: string;
}
/** `introduced` marks a find whose source introduces it: the paper's abstract or the launch post names it as its own. */
export type Find = Partial<Candidate> & { key: string; name: string; title: string; url: string; introduced?: boolean };
export interface How {
  feed?: string;
  curated?: Source;
  registry?: Source;
}

// ---- the registry, for telling new from known ----------------------------------------------------
const registry = readJson<{ id: string; name: string; org?: string; aliases?: string[]; links?: Record<string, string> }[]>(dataPath('benchmarks.json'));
const registryById = new Map(registry.map((b) => [b.id, b]));
const known = new Map<string, string>();
// arXiv id -> registry id, so a find listed under its paper title still meets the benchmark it introduced
const knownPapers = new Map<string, string>();
/** The arXiv id in an arXiv or Hugging Face papers link. */
export const arxivId = (url?: string) => url?.match(/(?:arxiv\.org\/(?:abs|pdf|html)|huggingface\.co\/papers)\/(\d{4}\.\d{4,5})/)?.[1];
// every record with a name, for names two records share (Ai2's StateBench, Microsoft's STATE-Bench)
const knownAll = new Map<string, string[]>();
for (const b of registry) {
  for (const n of [b.name, ...(b.aliases ?? [])])
    if (key(n).length >= 3) {
      known.set(key(n), b.id);
      if (!knownAll.get(key(n))?.includes(b.id)) knownAll.set(key(n), [...(knownAll.get(key(n)) ?? []), b.id]);
    }
  const paper = arxivId(b.links?.paper);
  if (paper && !knownPapers.has(paper)) knownPapers.set(paper, b.id);
}
// finds someone already checked and left out (data/reviewed.json, shown on the New page) do not come back to the queue.
// A left-out name often carries a gloss, "BedBench (Where Do Vision Language Models Fail at 3D Reasoning?)", or lists
// several names, "Ada-LEval, CIBench (OpenCompass)": each name and a paper title in the parentheses count on their own.
const reviewedPath = dataPath('reviewed.json');
if (existsSync(reviewedPath)) {
  const reviewed = readJson<{ rejected?: { name: string; url?: string }[] }>(reviewedPath);
  for (const r of reviewed.rejected ?? []) {
    const m = r.name.match(/^(.*?)\s*\((.+)\)\s*$/);
    const outer = m ? m[1] : r.name;
    const names = [r.name, outer, ...(outer.includes(',') ? outer.split(/\s*,\s*/) : [])];
    // a short gloss is usually an organization ("OpenCompass"), which must not block that name; a long one is a title
    if (m && m[2].split(/\s+/).length >= 4) names.push(m[2]);
    for (const n of names) if (key(n).length >= 3 && !known.has(key(n))) known.set(key(n), `left-out:${key(r.name)}`);
    const paper = arxivId(r.url);
    if (paper && !knownPapers.has(paper)) knownPapers.set(paper, `left-out:${key(r.name)}`);
  }
}
const repoKey = (u?: string) => u?.match(/github\.com\/([\w.-]+\/[\w.-]+)/i)?.[1].toLowerCase().replace(/\.git$/, '');
// one maker, several spellings in the catalog's org field
const ORG_SPELLINGS: [RegExp, string][] = [
  [/allen ?institute for ai|allenai/gi, 'ai2'],
  [/google deepmind|deepmind/gi, 'google'],
  [/meta ai|facebook ai research|facebook/gi, 'meta'],
];
const orgKey = (s?: string) => key(ORG_SPELLINGS.reduce((t, [re, v]) => t.replace(re, v), s ?? '')).replace(/^(the|team)/, '');
/**
 * Whether a find that introduces its own benchmark is a different test from the cataloged record with the same
 * name: its paper, repository or organization differs. Ai2's StateBench (2026) is not Microsoft's STATE-Bench.
 * A find that only mentions a name never counts, since mentions carry no paper or maker of their own.
 */
function otherWithSameName(c: { introduced?: boolean; arxiv?: string; repo?: string; org?: string }, id: string): boolean {
  const b = registryById.get(id);
  if (!b || !c.introduced) return false;
  // a different paper counts only when the record has one. A record with no paper may simply be meeting its own
  // paper for the first time (FrontierPhysics' leaderboard came two months before its arXiv paper)
  if (c.arxiv && b.links?.paper && c.arxiv !== arxivId(b.links.paper)) return true;
  const mine = repoKey(c.repo);
  const theirs = repoKey(b.links?.repo);
  if (mine && theirs && mine !== theirs) return true;
  const [o1, o2] = [orgKey(c.org), orgKey(b.org)];
  return !!(o1 && o2 && !o1.includes(o2) && !o2.includes(o1));
}
type Lookup = { name: string; url?: string; arxiv?: string; repo?: string; org?: string; introduced?: boolean; sameNameAs?: string };
/** Every record (or left-out mark) a find's name matches. */
function namedIds(name: string): string[] {
  const id = knownId(name);
  if (!id) return [];
  const all = spellings(name).flatMap((sp) => knownAll.get(key(sp)) ?? []);
  return [...new Set([id, ...all])];
}
/** The registry id (or left-out mark) for a find, by the paper behind it or by its name. */
export function knownFind(c: Lookup): string | undefined {
  const paper = knownPapers.get(c.arxiv ?? arxivId(c.url) ?? '');
  if (paper) return paper;
  // known when any record with the name is this test: a left-out mark, or a record it does not differ from
  return namedIds(c.name).find((id) => id.startsWith('left-out:') || (c.sameNameAs !== id && !otherWithSameName(c, id)));
}
/** The cataloged record a find shares its name with, when the find is a different test. */
export function sameNameAs(c: Lookup): string | undefined {
  if (knownFind(c)) return undefined;
  return namedIds(c.name).find((id) => !id.startsWith('left-out:'));
}

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
/** The registry id for a name, if the almanac already catalogs it. */
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
// a new benchmark usually reports a model sweep: "We evaluate 18 closed- and open-weight models"
const SWEEP =
  /\b(?:evaluat|test|assess|compar)\w*\s+(?:\d{1,3}|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\w+teen|twenty)\s+(?:[\w-]+\s+){0,4}?(?:models|LLMs|VLMs|MLLMs|agents|systems)\b/i;
export const GENERAL = /\b(LLMs?|language models?|agents?|agentic|VLMs?|MLLMs?|multimodal|foundation models?|coding|computer[- ]use|reasoning models?|frontier models?|AI[- ](?:systems?|models?|agents?))\b/i;
export const NICHE = /\b(crowd counting|defect detection|pathology|fusion|hardware|FPGA|GPU kernel speed|segmentation of|remote sensing|shampoo|traffic sign)\b/i;
export const KNOWN_ORGS =
  /openai|anthropic|google|deepmind|meta|facebook|microsoft|nvidia|apple|amazon|alibaba|qwen|deepseek|moonshot|zhipu|z-ai|thudm|tencent|bytedance|salesforce|scale|epoch|metr|vals|lmarena|andon|aisi|allenai|ai2|huggingface|stanford|berkeley|princeton|mit|cmu|harvard|oxford|cambridge|tsinghua|peking|ucl|eth/i;
// names that end like a benchmark but are organizations or products
const NOT_BENCHMARKS = new Set(['lmarena', 'designarena', 'evalevalcoalition', 'openeval', 'everyevalever']);

/** Single-token benchmark names: "HackBench", "SWE-bench". The keyword must end the word, so "Example" does not count. */
export function names(text: string): string[] {
  const tail = /(Bench|BENCH|bench|Eval|EVAL|Evals|Arena|Gym|Exam|Leaderboard)(?![a-z])/;
  // a word that starts a compound ("Eval-to-deployment gap") is not a name, but "Arena-Hard" is
  const compound = /^(?:Bench|Eval|Evals|Arena|Gym|Exam|Leaderboard)-[a-z]/;
  return [...new Set((text.match(NAME) ?? []).filter((n) => !BARE.test(n) && tail.test(n) && !compound.test(n) && n.length >= 5 && /[A-Z]/.test(n) && !NOT_BENCHMARKS.has(key(n))))];
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

// "we construct StateBench, a 4-tier long-horizon state-tracking benchmark": the name right after the verb,
// with a benchmark word later in the same sentence
const INTRO_NAME =
  /\b(?:[Ww]e|[Tt]his (?:paper|work))\s+(?:also\s+)?(?:introduce|present|propose|release|construct|build|curate|develop|create)s?\s+(?:the\s+|our\s+)?([A-Z][\w.+-]{2,30}(?:[ ][A-Z0-9][\w.+-]*){0,2})\s*(?:[,(:—–]|\s-\s)[^.]{0,120}?\b(?:benchmark|evaluation suite|test ?bed|leaderboard|arena|dataset|eval)/g;
// "we introduce the Collaborative Intelligence Benchmark, which measures...": a capitalized name that ends in a
// benchmark word, right after the verb
const INTRO_PHRASE =
  /\b(?:[Ww]e|[Tt]his (?:paper|work))\s+(?:also\s+)?(?:introduce|present|propose|release|construct|build|curate|develop|create)s?\s+(?:the\s+|our\s+)?((?:[A-Z][\w'’.+-]*\s+){1,4}(?:Benchmark|Bench|Eval|Arena|Leaderboard|Gym|Exam))\b/g;
/** The benchmark an abstract introduces by name, if it names one. */
export function introName(abstract: string): string | undefined {
  for (const m of abstract.matchAll(INTRO_NAME)) if (!BARE.test(m[1])) return m[1];
  for (const m of abstract.matchAll(INTRO_PHRASE)) if (phraseNames(m[1]).includes(m[1])) return m[1];
  return undefined;
}

/**
 * A paper's benchmark name: a Bench-style name its abstract introduces when the title's head is not one, else the
 * part before the colon when it is short, else a Bench-style name in the title, else the name the abstract
 * introduces, else the title. "GeoFaham: Multi-Agent Geospatial Analytics" introduces GeoFaham-Bench, and
 * "One Assistant, Many Memories: Benchmarking..." introduces GroupAssistBench.
 */
export function paperName(title: string, abstract = ''): string {
  const head = title.split(':')[0].trim();
  const intro = introName(abstract);
  if (intro && benchLike(intro) && !benchLike(head)) return intro;
  if (head !== title && head.length <= 40 && head.split(/\s+/).length <= 4) return head;
  return names(title)[0] ?? intro ?? title;
}

// ---- launch posts ----------------------------------------------------------------------------------
const VERB = String.raw`(?:[Ii]ntroduc|[Rr]eleas|[Ll]aunch|[Aa]nnounc|[Uu]nveil|[Oo]pen[- ][Ss]ourc|[Dd]ebut)\w*`;
const LAUNCH_NAME = String.raw`([A-Z][\w.+-]{1,30}(?:[ ][A-Z0-9][\w.+-]*){0,2}|[a-z][a-z0-9]*(?:-[a-z0-9]+)*-(?:bench|eval)s?)`;
const LAUNCH = new RegExp(String.raw`\b${VERB}\s+(?:the\s+|our\s+)?${LAUNCH_NAME}(?![\w.+-])(?:\s+v?\d[\w.]*)?`, 'g');
// what follows a name that does not say benchmark itself: "GDPx, an agentic capability benchmark", "LifeVal, new benchmark"
const APPOSITIVE = /^\s*(?:,|:|—|–|\(|is)?\s*(?:(?:a|an|our|the)\s+)?(?:new\s+)?(?:(?!which\b|that\b|who\b|and\b|but\b|to\b|on\b|in\b)[\w-]+\s+){0,4}?(?:benchmark|eval|evaluation|leaderboard)s?\b/i;
const NEW_NAME = /\b(?:our|a|the|their|its)\s+new\s+([A-Z][\w.+-]{1,30})\s+(?:benchmark|eval|evaluation|leaderboard|suite)\b/g;
const benchLike = (n: string) => names(n).length > 0 || /-(?:bench|eval)s?$/.test(n) || phraseNames(n).includes(n);
const NOT_LAUNCHES = /^(?:AI|LLMs?|GPT|Claude|Gemini|Today|Our|This|The|New|We)$/;

/**
 * The benchmarks a launch post or an announcement introduces: "Today we're releasing GDPx, a benchmark for...",
 * "We're releasing StateBench so researchers can...", "OpenAI unveils LifeVal, new benchmark...". A post title
 * like "GDPx: Measuring Frontier Model Capabilities" counts when the text calls the name a benchmark.
 */
export function launchNames(text: string, title = ''): string[] {
  const out = new Set<string>();
  const head = title.split(/\s*[:—–|]\s*/)[0].trim();
  if (head && head !== title.trim() && head.length <= 40 && head.split(/\s+/).length <= 4) {
    const esc = head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (benchLike(head) || new RegExp(String.raw`\b${esc}\b\s*(?:is|,)\s+(?:a|an|our)\s+(?:new\s+)?(?:[\w-]+\s+){0,4}?(?:benchmark|eval|evaluation|leaderboard)`, 'i').test(text))
      out.add(head);
  }
  for (const m of text.matchAll(LAUNCH)) {
    const n = m[1].trim();
    if (NOT_LAUNCHES.test(n) || BARE.test(n)) continue;
    if (benchLike(n) || APPOSITIVE.test(text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 90))) out.add(n);
  }
  for (const m of text.matchAll(NEW_NAME)) if (!NOT_LAUNCHES.test(m[1])) out.add(m[1]);
  return [...out];
}

export function stageA(title: string, abstract: string, hasArtifact: boolean): number {
  let s = 0;
  const titleNames = names(title);
  if (titleNames.length) s += 3;
  if (TITLE.test(title)) s += 2;
  const intro = abstract.match(INTRO);
  if (intro) {
    s += 3;
    // the abstract names what it introduces. "the Collaborative Intelligence Benchmark" counts like "StateBench".
    if (names(intro[0]).length || introName(abstract)) s += 1;
    // and tests a set of models on it (added 2026-11-04, after the scan missed that benchmark at 3 points)
    if (SWEEP.test(abstract)) s += 1;
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

/** Adds a find to the queue, or more evidence to a find already there. Names already cataloged are skipped. */
function upsert(c: Find, how: How): { known: string } | { candidate: Candidate } {
  const k = knownFind(c);
  if (k) return { known: k };
  const twin = sameNameAs(c);
  const cur =
    byKey.get(c.key) ??
    byKey.get(key(c.name)) ??
    ({ key: c.key, name: c.name, title: c.title, url: c.url, first: TODAY, last: TODAY, feeds: [], curated: [], registries: [], stageA: 0, general: false, niche: false, score: 0, decision: 'watch' } as Candidate);
  cur.last = TODAY;
  // a find first listed under its paper title takes the name a later source gives it
  if (cur.name === cur.title && c.name !== c.title && c.name !== cur.name) cur.name = c.name;
  // and a paper first listed under its system's name ("GeoFaham") takes the benchmark's name ("GeoFaham-Bench")
  else if (c.key === cur.key && c.name !== c.title && benchLike(c.name) && !benchLike(cur.name)) cur.name = c.name;
  if (twin) cur.sameNameAs = twin;
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

// ---- papers for cataloged benchmarks -----------------------------------------------------------------
// A benchmark often joins the catalog through its leaderboard or launch post and gets its paper later. When a
// reader meets a paper that introduces a cataloged name, and the record has no paper link, the paper waits on the
// New page for a person to check and link it.
const paperFinds = new Map((store.papers ?? []).map((p) => [p.arxiv, p]));
function notePaper(id: string, c: Find, source: string) {
  const ax = c.arxiv ?? arxivId(c.url);
  const b = registryById.get(id);
  if (!c.introduced || !ax || !b || b.links?.paper || knownPapers.has(ax)) return;
  const cur = paperFinds.get(ax) ?? { benchmark: id, arxiv: ax, title: c.title, url: `https://arxiv.org/abs/${ax}`, source, first: TODAY, last: TODAY };
  cur.last = TODAY;
  paperFinds.set(ax, cur);
}
/** The papers still waiting: their record has no paper link yet, and a reader saw them in the last 30 days. */
export function papersForCatalog(): PaperFind[] {
  return [...paperFinds.values()]
    .filter((p) => registryById.has(p.benchmark) && !registryById.get(p.benchmark)!.links?.paper && p.last >= daysAgo(30))
    .sort((a, b) => b.last.localeCompare(a.last));
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
  /** Milliseconds before the first retry. Later retries wait longer. */
  wait?: number;
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
        await new Promise((r) => setTimeout(r, (o.wait ?? 1500) * (i + 1)));
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
      if ('known' in r) {
        knownIds.add(r.known);
        notePaper(r.known, c, id);
      } else cands.add(r.candidate);
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
/** "agent_bash_reliability" to "Agent Bash Reliability". */
export const humanize = (slug: string) => slug.replace(/[_]+/g, ' ').replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
export const githubRepo = (url: string) => url.match(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/)?.[0].replace(/\.git$/, '');
