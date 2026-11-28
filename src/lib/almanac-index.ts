// The Almanac Index's math. It has no data imports: src/lib/almanac-index-data.ts builds its input from the site's
// data, and the page and /index/recipe.json call it.
//
// The index picks its own tests by how much labs use them. A version (YY.MM) freezes on the 1st of its month from the
// data through the day before: which tests count, their weights, and each domain's board. A recipe holds that frozen
// part (data/index/YY.MM.json). Every version then ranks models with the latest scores.
//
// 1. A test can count when it measures a capability, at least 8 models have a score, and it neither saturates (the top
//    three average 95% or more) nor floors (under 5%).
// 2. Its relevance is a weighted sum of percentiles among the tests that can count: labs that cited it in launch posts
//    and in system cards over the past year, releases that cited it, and current models with an independent run or
//    any score. Citations pool over a test's family, so a lab citing Terminal-Bench 2.0 cites Terminal-Bench. Its
//    weight is its relevance squared.
// 3. One logit fit across every test that counts gives each model an ability and each test a difficulty, so a model
//    is not lifted by the hard tests it skipped (as in build-index.ts).
// 4. Each domain's board holds up to 12 tests, one version per family: the newest version that at least half as many
//    labs cited over the past six months as the most cited version. A model's domain value is the weighted mean of
//    its board scores, with a score it lacks predicted from its domain ability (its domain scores plus its overall
//    ability counted as the board's median weight).
// 5. The headline is the weighted mean of domain values, a domain weighing the sum of its board's weights. A domain
//    where a model has too few scores is filled from its level in the domains where it is ranked, on the logit scale.

// ---- input ---------------------------------------------------------------------------------------------------------

export interface IndexBench {
  id: string;
  name: string;
  family: string | null;
  area: string;
  category: string;
  subcategory: string;
  unit: string;
  better: 'higher' | 'lower';
  successor: string | null;
  /** YYYY-MM. */
  released: string;
  construct: string | null;
  risk: string[];
  propensity: string[];
  combines: boolean;
  runner: string | null;
  basis: string | null;
  subject: string[];
}

export interface IndexModel {
  id: string;
  name: string;
  lab: string;
  labName: string;
  released: string;
}

/** One benchmark result in a lab's launch post or system card. */
export interface IndexCite {
  bench: string;
  kind: 'launch' | 'system-card';
  /** The release it belongs to: a system card's launch post, or the launch post itself. */
  release: string;
  lab: string;
  date: string;
}

export interface IndexInput {
  /** The data's date. Boards show models released in the year before it. */
  asOf: string;
  benches: IndexBench[];
  models: IndexModel[];
  /** Best independent run per benchmark and model: leaderboards and Epoch AI's runs. */
  ind: Record<string, Record<string, number>>;
  /** Best number a lab reports for its own model, per benchmark and model. */
  lab: Record<string, Record<string, number>>;
  cites: IndexCite[];
}

// ---- settings ------------------------------------------------------------------------------------------------------

export const SETTINGS = {
  minModels: 8,
  saturated: 95,
  floor: 5,
  /** A board test needs scores from this many current models. */
  refCurrent: 5,
  perDomain: 12,
  /** A model needs real scores on board tests holding this share of a board's weight to rank in the domain. */
  refShare: 0.2,
  /** A model needs ranked domains holding this share of the domain weight to rank overall. */
  domainShare: 0.4,
  /** With at least this share it shows as provisional. */
  provisional: 0.15,
  draws: 200,
  signals: { launchLabs: 0.35, cardLabs: 0.2, releases: 0.15, independent: 0.15, current: 0.15 } as Record<Signal, number>,
};
export type Signal = 'launchLabs' | 'cardLabs' | 'releases' | 'independent' | 'current';
const SIGNALS = Object.keys(SETTINGS.signals) as Signal[];

/** Categories outside a language model index: generation models, robots and world models have their own boards. */
const OUT_CATEGORIES = new Set(['robotics-embodied', 'world-models']);
const OUT_SUBCATEGORIES = new Set(['image-generation', 'video-generation', 'audio-speech', 'vision-detection', 'video-captioning']);

/** The domains: each a set of subcategories (data/taxonomy.json) and OECD subject codes (data/facets.json). */
export const DOMAINS: { id: string; name: string; group: string; subs: string[]; subjects: string[] }[] = [
  { id: 'swe', name: 'Software engineering', group: 'Code', subs: ['coding-repositories', 'coding-projects', 'coding-performance', 'terminal-tasks', 'terminal-long'], subjects: [] },
  { id: 'frontend', name: 'Front ends and apps', group: 'Code', subs: ['coding-frontend'], subjects: [] },
  { id: 'competitive', name: 'Competitive programming', group: 'Code', subs: ['coding-competitive', 'coding-functions'], subjects: [] },
  { id: 'data', name: 'Data science and SQL', group: 'Code', subs: ['coding-data'], subjects: [] },
  { id: 'ai-rnd', name: 'AI research and engineering', group: 'Code', subs: ['rnd-ml-engineering', 'rnd-research', 'rnd-kernels', 'rnd-time-horizon'], subjects: [] },
  { id: 'cad', name: 'CAD', group: 'Engineering', subs: ['engineering-cad'], subjects: [] },
  { id: 'chips', name: 'Electronics and chip design', group: 'Engineering', subs: ['engineering-electronics'], subjects: [] },
  { id: 'materials', name: 'Chemistry and materials', group: 'Science', subs: [], subjects: ['2.5', '1.4', '2.4', '2.10'] },
  { id: 'physics', name: 'Physics', group: 'Science', subs: [], subjects: ['1.3'] },
  { id: 'biology', name: 'Biology', group: 'Science', subs: [], subjects: ['1.6', '3.4'] },
  { id: 'science', name: 'Research science', group: 'Science', subs: ['science-research', 'science-lab', 'science-questions', 'science-olympiad'], subjects: [] },
  { id: 'math', name: 'Math', group: 'Science', subs: ['math-competition', 'math-research', 'math-proofs', 'math-word-problems'], subjects: [] },
  { id: 'finance', name: 'Finance', group: 'Professions', subs: ['domain-finance'], subjects: [] },
  { id: 'law', name: 'Law', group: 'Professions', subs: ['domain-law'], subjects: [] },
  { id: 'medicine', name: 'Medicine', group: 'Professions', subs: ['domain-medicine'], subjects: [] },
  { id: 'office', name: 'Office and professional tasks', group: 'Professions', subs: ['work-occupations', 'work-office', 'domain-other'], subjects: [] },
  { id: 'business', name: 'Running a business', group: 'Professions', subs: ['work-business', 'work-company'], subjects: [] },
  { id: 'computer-use', name: 'Computer and browser use', group: 'Agents', subs: ['computer-web', 'computer-desktop', 'computer-mobile', 'computer-grounding'], subjects: [] },
  { id: 'tools', name: 'Tools and customer service', group: 'Agents', subs: ['tools-apps', 'tools-customer-service', 'tools-assistants', 'tools-function-calling'], subjects: [] },
  { id: 'research', name: 'Deep research and search', group: 'Agents', subs: ['tools-deep-research', 'knowledge-search'], subjects: [] },
  { id: 'games', name: 'Games and puzzles', group: 'Agents', subs: ['games-puzzles', 'games-video-games', 'games-multi-agent'], subjects: [] },
  { id: 'knowledge', name: 'Knowledge and facts', group: 'Language', subs: ['knowledge-expert', 'knowledge-exams', 'knowledge-trivia', 'factuality-short', 'factuality-hallucination', 'factuality-grounding'], subjects: [] },
  { id: 'long-context', name: 'Long context', group: 'Language', subs: ['long-retrieval', 'long-reasoning', 'long-learning'], subjects: [] },
  { id: 'chat', name: 'Instructions and chat', group: 'Language', subs: ['chat-instructions', 'chat-quality', 'chat-multi-turn'], subjects: [] },
  { id: 'writing', name: 'Writing', group: 'Language', subs: ['writing-creative', 'writing-taste'], subjects: [] },
  { id: 'multilingual', name: 'Multilingual', group: 'Language', subs: ['multilingual-knowledge', 'multilingual-reading', 'multilingual-reasoning', 'multilingual-chat', 'multilingual-translation'], subjects: [] },
  { id: 'forecasting', name: 'Forecasting', group: 'Language', subs: ['forecasting-events'], subjects: [] },
  { id: 'vision', name: 'Vision', group: 'Vision', subs: ['vision-documents', 'vision-general', 'vision-spatial', 'vision-math'], subjects: [] },
];

// ---- the recipe: what a version freezes ------------------------------------------------------------------------------

/** Per test that can count: [weight, relevance, launchLabs, cardLabs, labs, releases, independent, current, recentLabs]. */
export type TestFacts = [number, number, number, number, number, number, number, number, number];

export interface RecipeDomain {
  id: string;
  name: string;
  group: string;
  /** Every test in the domain that can count, most relevant first. */
  pool: string[];
  /** The board: [test id, its family group]. */
  ref: [string, string][];
  /** Its overall ability counts as this much weight in a domain ability. */
  kappa: number;
}

export interface Recipe {
  version: string;
  cutoff: string;
  /** The day the sync saved it, or null when it was rebuilt after the fact. */
  frozen: string | null;
  rebuilt: boolean;
  settings: typeof SETTINGS;
  tests: Record<string, TestFacts>;
  /** Why a test in some domain cannot count, as reason -> test ids. */
  status: Record<string, string[]>;
  domains: RecipeDomain[];
  /** Each ranked domain's share of the headline. */
  weights: Record<string, number>;
  /** One row per test family, most relevant first. */
  ranking: { id: string; relevance: number; versions: number; domains: string[]; signal: Record<Signal, number> }[];
}

const day = (s: string) => Date.parse(`${s}T00:00:00Z`);
export const back = (s: string, n: number) => new Date(day(s) - n * 864e5).toISOString().slice(0, 10);
const round = (v: number, k = 1) => Math.round(v * 10 ** k) / 10 ** k;
const pushTo = <K, V>(m: Map<K, V[]>, k: K, v: V) => (m.get(k) ?? m.set(k, []).get(k)!).push(v);
const addTo = <K, V>(m: Map<K, Set<V>>, k: K, v: V) => (m.get(k) ?? m.set(k, new Set()).get(k)!).add(v);

/** Scores per benchmark, an independent run before the lab's number. */
function columns(input: IndexInput) {
  const col = new Map<string, Map<string, number>>();
  for (const b of input.benches) {
    const c = new Map(Object.entries(input.lab[b.id] ?? {}));
    for (const [m, v] of Object.entries(input.ind[b.id] ?? {})) c.set(m, v);
    if (c.size) col.set(b.id, c);
  }
  return col;
}

function capability(b: IndexBench) {
  if (b.construct !== 'capability') return false;
  if (b.risk.some((x) => x !== 'none') || b.propensity.some((x) => x !== 'none')) return false;
  if (b.combines) return false;
  // a lab's own test of its own models ranks only that lab's models
  if (b.runner === 'developer' && (b.basis ?? 'original') === 'original') return false;
  return b.area !== 'other';
}

export const NOT_YET = 'not in the catalog yet';

function inDomain(b: IndexBench, d: (typeof DOMAINS)[number]) {
  if (d.subs.includes(b.subcategory)) return true;
  const mine = b.subject.filter((x) => x !== 'none');
  // only tests about one or two fields, so a general exam stays out of a subject domain
  return mine.length > 0 && mine.length <= 2 && mine.some((x) => d.subjects.includes(x));
}

/** Families: the family field and successor links, so a board takes one version of each test. */
function groups(benches: IndexBench[]) {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    while ((parent.get(x) ?? x) !== x) x = parent.get(x)!;
    return x;
  };
  const ids = new Set(benches.map((b) => b.id));
  for (const b of benches) {
    if (b.family) parent.set(find(b.id), find(`fam:${b.family}`));
    if (b.successor && ids.has(b.successor)) parent.set(find(b.id), find(b.successor));
  }
  return new Map(benches.map((b) => [b.id, find(b.id)]));
}

/** Freeze a version: its tests, weights and boards from the data through `cutoff`. */
export function makeRecipe(input: IndexInput, version: string, cutoff: string, frozen: string | null = null): Recipe {
  const S = SETTINGS;
  const bench = new Map(input.benches.map((b) => [b.id, b]));
  const released = new Map(input.models.map((m) => [m.id, m.released ?? '']));
  const relOf = (m: string) => released.get(m) ?? '';
  const known = (m: string) => relOf(m) <= cutoff; // a model with no release date counts as older than any cutoff
  const col = columns(input);
  const asof = (b: string) => [...(col.get(b) ?? new Map<string, number>())].filter(([m]) => known(m));
  const yearAgo = back(cutoff, 365);
  const halfAgo = back(cutoff, 182);

  const reason = (b: IndexBench): string | null => {
    // the test's own release month, not the day it joined the catalog: most records joined in November 2026 sweeps
    if (b.released && b.released > cutoff.slice(0, 7)) return NOT_YET;
    if (OUT_CATEGORIES.has(b.category) || OUT_SUBCATEGORIES.has(b.subcategory)) return 'out of scope (generation, robots, world models)';
    if (!capability(b)) return 'not a capability test, or a lab’s internal test';
    if (b.unit === 'usd') return 'a cost';
    const c = asof(b.id);
    if (c.length < S.minModels) return `fewer than ${S.minModels} models scored`;
    if (b.unit === '%' && b.better !== 'lower') {
      const top = c.map(([, v]) => v).sort((x, y) => y - x).slice(0, 3);
      const avg = top.reduce((s, v) => s + v, 0) / top.length;
      if (avg >= S.saturated) return 'saturated: the top three average 95% or more';
      if (avg < S.floor) return 'nobody scores yet: the top three average under 5%';
    }
    return null;
  };
  const why = new Map(input.benches.map((b) => [b.id, reason(b)]));
  const elig = input.benches.filter((b) => why.get(b.id) === null).map((b) => b.id);
  const group = groups(input.benches);
  // citations pool over the family field only: a lab citing Terminal-Bench 2.0 is citing Terminal-Bench, but a lab
  // citing SWE-bench Verified is not citing SWE-bench Pro, which only replaced it
  const citeKey = (b: string) => (bench.get(b)!.family ? `fam:${bench.get(b)!.family}` : b);

  const launchLabs = new Map<string, Set<string>>();
  const cardLabs = new Map<string, Set<string>>();
  const releases = new Map<string, Set<string>>();
  const recentLabs = new Map<string, Set<string>>();
  for (const c of input.cites) {
    if (!(c.date > yearAgo && c.date <= cutoff) || !bench.has(c.bench)) continue;
    const k = citeKey(c.bench);
    addTo(c.kind === 'launch' ? launchLabs : cardLabs, k, c.lab);
    addTo(releases, k, c.release);
    if (c.date > halfAgo) addTo(recentLabs, c.bench, c.lab);
  }
  const size = (m: Map<string, Set<string>>, k: string) => m.get(k)?.size ?? 0;
  const raw = new Map<string, Record<Signal | 'recentLabs' | 'labs', number>>();
  for (const b of elig) {
    const k = citeKey(b);
    const cur = asof(b).filter(([m]) => relOf(m) > yearAgo);
    const indep = input.ind[b] ?? {};
    raw.set(b, {
      launchLabs: size(launchLabs, k),
      cardLabs: size(cardLabs, k),
      releases: size(releases, k),
      independent: cur.filter(([m]) => m in indep).length,
      current: cur.length,
      recentLabs: size(recentLabs, b),
      labs: new Set([...(launchLabs.get(k) ?? []), ...(cardLabs.get(k) ?? [])]).size,
    });
  }
  // each signal as a percentile among the tests that can count, ties at their middle rank
  const pct = new Map<Signal, Map<string, number>>();
  for (const s of SIGNALS) {
    const vals = elig.map((b) => raw.get(b)![s]).sort((x, y) => x - y);
    const lo = (v: number) => {
      let a = 0, z = vals.length;
      while (a < z) { const h = (a + z) >> 1; if (vals[h] < v) a = h + 1; else z = h; }
      return a;
    };
    const hi = (v: number) => {
      let a = 0, z = vals.length;
      while (a < z) { const h = (a + z) >> 1; if (vals[h] <= v) a = h + 1; else z = h; }
      return a;
    };
    pct.set(s, new Map(elig.map((b) => { const v = raw.get(b)![s]; return [b, (lo(v) + hi(v)) / 2 / vals.length]; })));
  }
  const relevance = new Map(elig.map((b) => [b, round(SIGNALS.reduce((t, s) => t + S.signals[s] * pct.get(s)!.get(b)!, 0), 4)]));
  const W = new Map(elig.map((b) => [b, relevance.get(b)! ** 2]));
  const byRel = [...elig].sort((x, y) => relevance.get(y)! - relevance.get(x)!);

  // the version of a family a board uses: the newest one that at least half as many labs cited in the past six months
  // as the most cited version, so a board moves to a new version once labs have moved
  const chosen = (members: string[]) => {
    const top = Math.max(...members.map((b) => raw.get(b)!.recentLabs));
    const ok = members.filter((b) => raw.get(b)!.recentLabs * 2 >= top);
    const list = ok.length ? ok : members;
    return list.reduce((best, b) => {
      const kb = bench.get(b)!.released ?? '', kx = bench.get(best)!.released ?? '';
      return kb > kx || (kb === kx && raw.get(b)!.current > raw.get(best)!.current) ? b : best;
    });
  };
  const famRel = (g: string[]) => Math.max(...g.map((b) => relevance.get(b)!));

  const domains: RecipeDomain[] = DOMAINS.map((d) => {
    const pool = byRel.filter((b) => inDomain(bench.get(b)!, d));
    const fam = new Map<string, string[]>();
    for (const b of pool) if (raw.get(b)!.current >= S.refCurrent) pushTo(fam, group.get(b)!, b);
    const ref = [...fam.values()]
      .map((g) => ({ b: chosen(g), r: famRel(g) }))
      .sort((x, y) => y.r - x.r)
      .slice(0, S.perDomain)
      .map(({ b }) => [b, group.get(b)!] as [string, string]);
    const ws = ref.map(([b]) => W.get(b)!).sort((x, y) => x - y);
    return { id: d.id, name: d.name, group: d.group, pool, ref, kappa: ws.length ? ws[ws.length >> 1] : 0 };
  });
  const dw = new Map(domains.filter((d) => d.ref.length >= 3).map((d) => [d.id, d.ref.reduce((t, [b]) => t + W.get(b)!, 0)]));
  const dwt = [...dw.values()].reduce((t, v) => t + v, 0);

  const members = new Map<string, string[]>();
  for (const b of elig) pushTo(members, group.get(b)!, b);
  const ranking = [...members.values()]
    .sort((x, y) => famRel(y) - famRel(x))
    .slice(0, 120)
    .map((g) => {
      const b = chosen(g);
      return {
        id: b,
        relevance: famRel(g),
        versions: g.length,
        domains: DOMAINS.filter((d) => inDomain(bench.get(b)!, d)).map((d) => d.id),
        signal: Object.fromEntries(SIGNALS.map((s) => [s, round(pct.get(s)!.get(b)!, 3)])) as Record<Signal, number>,
      };
    });

  const inSome = new Set(input.benches.filter((b) => DOMAINS.some((d) => inDomain(b, d))).map((b) => b.id));
  const status: Record<string, string[]> = {};
  for (const [b, w] of why) if (w && inSome.has(b)) (status[w] ??= []).push(b);

  return {
    version,
    cutoff,
    frozen,
    rebuilt: frozen === null,
    settings: SETTINGS,
    tests: Object.fromEntries(
      elig.map((b) => {
        const r = raw.get(b)!;
        return [b, [round(W.get(b)!, 5), relevance.get(b)!, r.launchLabs, r.cardLabs, r.labs, r.releases, r.independent, r.current, r.recentLabs]];
      }),
    ),
    status,
    domains,
    weights: Object.fromEntries([...dw].map(([k, v]) => [k, round(v / dwt, 5)])),
    ranking,
  };
}

// ---- ranking a version with the latest scores --------------------------------------------------------------------

const toLogit = (x: number) => {
  const p = Math.min(0.99, Math.max(0.01, x / 100));
  return Math.log(p / (1 - p));
};
const fromLogit = (z: number) => 100 / (1 + Math.exp(-z));

/** A small seeded generator (mulberry32), so a build always shows the same stability shares. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Ranked {
  recipe: Recipe;
  /** Per domain: rows of ranked models (all, not only current), best first. */
  domainRows: Map<string, { model: string; value: number; tests: number; refTests: number; evidence: number; first: number; parts: (number | null)[]; pred: (number | null)[] }[]>;
  head: { model: string; value: number; domains: number; share: number; first: number; parts: Record<string, [number, 0 | 1]> }[];
  provisional: { model: string; value: number; domains: number; share: number; parts: Record<string, [number, 0 | 1]> }[];
  fitModels: number;
  /** Best score per board test today: [model, value]. */
  best: Map<string, [string, number]>;
}

export function rank(input: IndexInput, recipe: Recipe): Ranked {
  const S = recipe.settings;
  const bench = new Map(input.benches.map((b) => [b.id, b]));
  const modelIds = new Set(input.models.map((m) => m.id));
  const col = columns(input);
  const elig = Object.keys(recipe.tests).filter((b) => bench.has(b) && col.has(b));
  const W = new Map(elig.map((b) => [b, recipe.tests[b][0]]));

  // scores on 0 to 100, higher better: percentages as they are, other units from the lowest to the highest model
  const NORM = new Map<string, Map<string, number>>();
  for (const b of elig) {
    const c = col.get(b)!;
    const { unit, better } = bench.get(b)!;
    const low = better === 'lower';
    const n = new Map<string, number>();
    if (unit === '%') for (const [m, v] of c) { const x = Math.min(100, Math.max(0, v)); n.set(m, low ? 100 - x : x); }
    else {
      const vs = [...c.values()];
      const lo = Math.min(...vs), hi = Math.max(...vs);
      for (const [m, v] of c) { const x = hi > lo ? ((v - lo) / (hi - lo)) * 100 : 50; n.set(m, low ? 100 - x : x); }
    }
    NORM.set(b, n);
  }

  // the fit: logit score = ability - difficulty, weighted by the tests' weights
  const obs = new Map<string, Map<string, number>>();
  for (const b of elig) for (const [m, x] of NORM.get(b)!) (obs.get(m) ?? obs.set(m, new Map()).get(m)!).set(b, toLogit(x));
  const fit = [...obs.keys()].filter((m) => obs.get(m)!.size >= 3 && modelIds.has(m));
  const byTest = new Map<string, [string, number][]>();
  for (const m of fit) for (const [b, z] of obs.get(m)!) pushTo(byTest, b, [m, z]);
  let D = new Map(elig.map((b) => [b, 0]));
  const TH = new Map<string, number>();
  for (let it = 0; it < 500; it++) {
    for (const m of fit) {
      let s = 0, ws = 0;
      for (const [b, z] of obs.get(m)!) { const w = W.get(b)!; s += w * (z + D.get(b)!); ws += w; }
      TH.set(m, s / ws);
    }
    const nxt = new Map(elig.map((b) => { const l = byTest.get(b); return [b, l ? l.reduce((t, [m, z]) => t + TH.get(m)! - z, 0) / l.length : 0]; }));
    const mean = [...nxt.values()].reduce((t, v) => t + v, 0) / nxt.size;
    let move = 0;
    for (const b of elig) move = Math.max(move, Math.abs(nxt.get(b)! - mean - D.get(b)!));
    D = new Map(elig.map((b) => [b, nxt.get(b)! - mean]));
    if (move < 1e-6) break;
  }
  const FLOOR = new Map(elig.map((b) => [b, Math.min(...NORM.get(b)!.values())]));
  const CEIL = new Map(elig.map((b) => [b, Math.max(...NORM.get(b)!.values())]));
  const predict = (th: number, b: string) => Math.min(CEIL.get(b)!, Math.max(FLOOR.get(b)!, fromLogit(th - D.get(b)!)));

  const doms = recipe.domains.map((d) => ({
    ...d,
    pool: d.pool.filter((b) => W.has(b)),
    refIds: d.ref.map(([b]) => b).filter((b) => W.has(b)),
  }));
  /** Its domain scores, plus its overall ability counted as `kappa` of weight, so thin evidence leans on the overall. */
  const domainAbility = (m: string, pool: string[], w: Map<string, number>, kappa: number) => {
    let s = kappa * TH.get(m)!, ws = kappa;
    const o = obs.get(m)!;
    for (const b of pool) { const z = o.get(b); if (z !== undefined) { s += w.get(b)! * (z + D.get(b)!); ws += w.get(b)!; } }
    return s / ws;
  };
  const domainValue = (m: string, pool: string[], ref: string[], kappa: number, w: Map<string, number>) => {
    const th = domainAbility(m, pool, w, kappa);
    const tot = ref.reduce((t, b) => t + w.get(b)!, 0);
    return ref.reduce((t, b) => { const x = NORM.get(b)!.get(m); return t + (w.get(b)! / tot) * (x ?? predict(th, b)); }, 0);
  };
  /** Real scores on two or more board tests holding a fifth of the board's weight, and domain results that outweigh
   *  the guess from its overall ability. */
  const rankedIn = (m: string, pool: string[], ref: string[], kappa: number) => {
    const o = obs.get(m)!;
    const evid = pool.reduce((t, b) => t + (o.has(b) ? W.get(b)! : 0), 0);
    const on = ref.filter((b) => NORM.get(b)!.has(m));
    return on.length >= 2 && on.reduce((t, b) => t + W.get(b)!, 0) >= S.refShare * ref.reduce((t, b) => t + W.get(b)!, 0) && evid >= kappa;
  };

  const r = rng(7);
  const jit = Array.from({ length: S.draws }, () => new Map(elig.map((b) => [b, W.get(b)! * (0.5 + r())])));
  const DW = new Map(Object.entries(recipe.weights).filter(([x]) => doms.some((d) => d.id === x && d.refIds.length >= 3)));
  const dwt = [...DW.values()].reduce((t, v) => t + v, 0) || 1;
  for (const [x, v] of DW) DW.set(x, v / dwt);

  const vals = new Map<string, Map<string, number>>();
  const ranked = new Map<string, Set<string>>();
  const domainRows: Ranked['domainRows'] = new Map();
  for (const d of doms) {
    const rows: Ranked['domainRows'] extends Map<string, infer R> ? R : never = [];
    domainRows.set(d.id, rows);
    if (d.refIds.length < 3) continue;
    const base = new Map(fit.map((m) => [m, domainValue(m, d.pool, d.refIds, d.kappa, W)]));
    vals.set(d.id, base);
    const order = fit.filter((m) => rankedIn(m, d.pool, d.refIds, d.kappa)).sort((x, y) => base.get(y)! - base.get(x)!);
    const top = order.slice(0, 25);
    const first = new Map<string, number>();
    for (const w of jit) {
      let bm = '', bv = -Infinity;
      for (const m of top) { const v = domainValue(m, d.pool, d.refIds, d.kappa, w); if (v > bv) { bv = v; bm = m; } }
      if (bm) first.set(bm, (first.get(bm) ?? 0) + 1);
    }
    for (const m of order) {
      addTo(ranked, m, d.id);
      const th = domainAbility(m, d.pool, W, d.kappa);
      const o = obs.get(m)!;
      const evid = d.pool.reduce((t, b) => t + (o.has(b) ? W.get(b)! : 0), 0);
      rows.push({
        model: m,
        value: round(base.get(m)!),
        tests: d.pool.filter((b) => o.has(b)).length,
        refTests: d.refIds.filter((b) => NORM.get(b)!.has(m)).length,
        evidence: round(evid / (evid + d.kappa), 2),
        first: round((first.get(m) ?? 0) / S.draws, 3),
        parts: d.refIds.map((b) => { const x = NORM.get(b)!.get(m); return x === undefined ? null : round(x); }),
        pred: d.refIds.map((b) => (NORM.get(b)!.has(m) ? null : round(predict(th, b)))),
      });
    }
  }

  // the headline: a domain where a model has too few scores gets its usual standing from the domains where it is
  // ranked. Each ranked domain value is fit as the model's level plus the domain's level, on the logit scale, and the
  // gap is filled with the sum. A guess from its overall ability could run ahead of what its domain results show.
  const rankedVals = new Map<string, Map<string, number>>();
  for (const m of fit) {
    const own = new Map([...(ranked.get(m) ?? [])].filter((x) => DW.has(x)).map((x) => [x, vals.get(x)!.get(m)!]));
    if (own.size) rankedVals.set(m, own);
  }
  const A = new Map<string, number>([...rankedVals.keys()].map((m) => [m, 0]));
  const LVL = new Map<string, number>([...DW.keys()].map((x) => [x, 0]));
  for (let it = 0; it < 200; it++) {
    for (const x of DW.keys()) {
      let s = 0, n = 0;
      for (const [m, v] of rankedVals) if (v.has(x)) { s += toLogit(v.get(x)!) - A.get(m)!; n++; }
      LVL.set(x, n ? s / n : 0);
    }
    for (const [m, v] of rankedVals) {
      let s = 0, ws = 0;
      for (const [x, y] of v) { s += DW.get(x)! * (toLogit(y) - LVL.get(x)!); ws += DW.get(x)!; }
      A.set(m, ws ? s / ws : 0);
    }
  }
  const shareOf = (m: string) => [...(rankedVals.get(m)?.keys() ?? [])].reduce((t, x) => t + DW.get(x)!, 0);
  const hcand = [...rankedVals.keys()].filter((m) => shareOf(m) >= S.domainShare);
  const prov = [...rankedVals.keys()].filter((m) => shareOf(m) >= S.provisional && shareOf(m) < S.domainShare);
  /** Each domain's value for the model: its own where it is ranked, else its level plus the domain's level. */
  const partsOf = (m: string, dv: Map<string, number>) => {
    const own = [...(ranked.get(m) ?? [])].filter((x) => DW.has(x) && dv.has(x));
    const ws = own.reduce((t, x) => t + DW.get(x)!, 0);
    const a = own.reduce((t, x) => t + DW.get(x)! * (toLogit(dv.get(x)!) - LVL.get(x)!), 0) / ws;
    return new Map([...DW.keys()].map((x) => [x, own.includes(x) ? ([dv.get(x)!, 1] as [number, 0 | 1]) : ([fromLogit(a + LVL.get(x)!), 0] as [number, 0 | 1])]));
  };
  const total = (p: Map<string, [number, 0 | 1]>) => [...DW].reduce((t, [x, w]) => t + w * p.get(x)![0], 0);
  const hparts = new Map([...hcand, ...prov].map((m) => [m, partsOf(m, new Map([...DW.keys()].map((x) => [x, vals.get(x)!.get(m)!])))]));
  const hval = new Map([...hparts].map(([m, p]) => [m, total(p)]));
  const horder = [...hcand].sort((x, y) => hval.get(y)! - hval.get(x)!);
  const htop = horder.slice(0, 25);
  const hfirst = new Map<string, number>();
  for (const w of jit) {
    let bm = '', bv = -Infinity;
    for (const m of htop) {
      const dv = new Map<string, number>();
      for (const d of doms) if (DW.has(d.id) && ranked.get(m)?.has(d.id)) dv.set(d.id, domainValue(m, d.pool, d.refIds, d.kappa, w));
      const v = total(partsOf(m, dv));
      if (v > bv) { bv = v; bm = m; }
    }
    if (bm) hfirst.set(bm, (hfirst.get(bm) ?? 0) + 1);
  }
  const partsOut = (p: Map<string, [number, 0 | 1]>) => Object.fromEntries([...p].map(([x, [v, o]]) => [x, [round(v), o] as [number, 0 | 1]]));
  const ownCount = (p: Map<string, [number, 0 | 1]>) => [...p.values()].filter(([, o]) => o).length;
  const ownShare = (p: Map<string, [number, 0 | 1]>) => round([...p].reduce((t, [x, [, o]]) => t + (o ? DW.get(x)! : 0), 0), 2);

  const best = new Map<string, [string, number]>();
  for (const d of doms)
    for (const b of d.refIds) {
      const sign = bench.get(b)!.better === 'lower' ? -1 : 1;
      let bm = '', bv = -Infinity;
      for (const [m, v] of col.get(b)!) if (sign * v > bv) { bv = sign * v; bm = m; }
      best.set(b, [bm, round(sign * bv)]);
    }

  return {
    recipe,
    domainRows,
    head: horder.map((m) => { const p = hparts.get(m)!; return { model: m, value: round(hval.get(m)!), domains: ownCount(p), share: ownShare(p), first: round((hfirst.get(m) ?? 0) / S.draws, 3), parts: partsOut(p) }; }),
    provisional: [...prov].sort((x, y) => hval.get(y)! - hval.get(x)!).map((m) => { const p = hparts.get(m)!; return { model: m, value: round(hval.get(m)!), domains: ownCount(p), share: round(shareOf(m), 2), parts: partsOut(p) }; }),
    fitModels: fit.length,
    best,
  };
}

/** A recipe as data/index/YY.MM.json holds it: one entry per line, so a month's file reads well in a diff. */
export function recipeText(r: Recipe): string {
  const j = JSON.stringify;
  const obj = (o: Record<string, unknown>) => `{\n${Object.entries(o).map(([k, v]) => `    ${j(k)}: ${j(v)}`).join(',\n')}\n  }`;
  const arr = (a: unknown[]) => `[\n${a.map((v) => `    ${j(v)}`).join(',\n')}\n  ]`;
  const body = Object.entries(r).map(([k, v]) => {
    if (k === 'tests' || k === 'status' || k === 'weights') return `  ${j(k)}: ${obj(v as Record<string, unknown>)}`;
    if (k === 'domains' || k === 'ranking') return `  ${j(k)}: ${arr(v as unknown[])}`;
    return `  ${j(k)}: ${j(v)}`;
  });
  return `{\n${body.join(',\n')}\n}\n`;
}
