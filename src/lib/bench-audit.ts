// The data audit: for each benchmark, how complete and trustworthy our data on it is, as a list of simple checks.
// Every check reads data the site already loads (src/lib/data.ts), plus two reports that may not exist yet: the
// field watch (data/scores/field-review.json, from scripts/sync-leaderboards.ts) and the link check
// (data/audits/link-health.json, from scripts/link-check.ts). A check that doesn't apply to a benchmark is a note,
// never a problem: a system-card-only safety eval with no public board isn't failing for lacking one.
//
// auditOf() runs once per benchmark page, so everything shared is computed once on first use, and each call only
// reads the benchmark's own summary (memoized in data.ts) and a few small maps.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  AS_OF,
  benchById,
  benchmarks,
  benchSummary,
  cards,
  systemCards,
  eciByModel,
  eciOrder,
  INTERVALS,
  intervalName,
  LEADERBOARDS,
  leaderboardScores,
  systemScores,
  unlistedScores,
  epochScores,
  collectedScores,
  modelById,
  monthsBetween,
  normUnit,
  SATURATED,
} from './data.ts';
import type { Benchmark, Score } from './types.ts';
import { issuesByBenchmark, PROBLEMS } from './audits.ts';
import { claimsForBenchmark, claimNote, gapText } from './claims.ts';
import { unreadWhy } from './unread.ts';
import { isArena } from './counts.ts';
import { CATEGORY_NAMES, FORMAT_BY_ID, LEVEL_BY_ID, SCORING_BY_ID, SUB_BY_ID } from './taxonomy.ts';
import { humanDate, longMonthYear, hostname, score as fmt, count, lowerLabel } from './format.ts';

export type AuditStatus = 'pass' | 'warn' | 'fail' | 'info';
export type AuditGroup = 'record' | 'scores' | 'import' | 'consistency' | 'links';

export interface AuditCheck {
  group: AuditGroup;
  key: string;
  status: AuditStatus;
  /** The check's name, the same on every page. */
  label: string;
  /** What we found for this benchmark, in a sentence or two. */
  detail: string;
}
export interface AuditSummary {
  pass: number;
  warn: number;
  fail: number;
  info: number;
  /** Checks that apply: passes, warnings and problems. Notes don't count. */
  checked: number;
  /** "14 of 17 checks pass, 2 warnings, 1 problem" */
  text: string;
}
export interface BenchAudit {
  id: string;
  checks: AuditCheck[];
  summary: AuditSummary;
}

export const GROUPS: { id: AuditGroup; name: string }[] = [
  { id: 'record', name: 'Catalog record' },
  { id: 'scores', name: 'Scores' },
  { id: 'import', name: 'Leaderboard import' },
  { id: 'consistency', name: 'Consistency' },
  { id: 'links', name: 'Links' },
];

/** Each status as a word, so a status never rests on its color alone. */
export const STATUS_WORD: Record<AuditStatus, string> = { pass: 'Pass', warn: 'Warning', fail: 'Problem', info: 'Note' };

/** Every check: its group, its name, the rule in words, and what a warning or problem means, as a phrase for captions. */
// Which checks readers see. The public site shows the checks that tell a reader how far to trust a benchmark's
// numbers: how well we verified its record, whether its tasks are public, who has scored it and how recently, whether
// our read of its board is fresh, how far labs' own numbers sit from independent runs, and open findings from
// published audits. The rest are our own to-do list (missing fields, duplicate rows, dead links), shown only under
// `astro dev` and to scripts, where import.meta.env.DEV is true or missing.
export const ALL_CHECKS = (import.meta as { env?: { DEV?: boolean } }).env?.DEV !== false;

export const CHECKS: Record<string, { group: AuditGroup; label: string; rule: string; problem: string; public?: true }> = {
  'record.description': { group: 'record', label: 'Description', problem: 'a missing or short description', rule: 'Passes when the record says what the benchmark tests in at least 40 characters.' },
  'record.maker': { group: 'record', label: 'Maker', problem: 'no maker named', rule: 'Passes when the record names who made the benchmark.' },
  'record.released': { group: 'record', label: 'Release month', problem: 'no release month', rule: 'Passes when the record gives the month the benchmark came out.' },
  'record.kind': { group: 'record', label: 'Category', problem: 'no finer category', rule: 'Passes when the record has a category other than Other, and a finer kind from the taxonomy.' },
  'record.level': { group: 'record', label: 'Level', problem: 'no level', rule: 'Passes when the record says who could solve the tasks, from everyday to research frontier. Rankings by votes or matches don’t need one.' },
  'record.scoring': { group: 'record', label: 'Scoring method', problem: 'no scoring method', rule: 'Passes when the record says how a score is decided, such as an answer key or a model judge.' },
  'record.format': { group: 'record', label: 'Answer format', problem: 'no answer format', rule: 'Passes when the record says what the model produces, such as multiple choice or code.' },
  'record.access': { group: 'record', public: true, label: 'Task access', problem: 'unknown task access', rule: 'Passes when the record says whether the tasks are public or private.' },
  'record.unit': { group: 'record', label: 'Unit and direction', problem: 'a missing unit or direction', rule: 'Passes when the record names the score’s unit and whether higher or lower is better. Without them, pages assume a percent where higher is better.' },
  'record.confidence': { group: 'record', public: true, label: 'Confidence', problem: 'a record we haven’t fully verified', rule: 'Passes when we checked the record against a primary source. Likely means some facts rest on secondary sources. Unverified means we haven’t checked it yet.' },
  'record.evidence': { group: 'record', label: 'Evidence', problem: 'no evidence links', rule: 'Passes when the record lists the sources its facts come from.' },
  'record.paper': { group: 'record', label: 'Paper or site', problem: 'no paper or site', rule: 'Passes when the record links the makers’ paper or page. An in-house eval that only lab documents describe doesn’t need one.' },
  'record.code': { group: 'record', label: 'Code or data', problem: 'no code or data', rule: 'Passes when the record links the code or the dataset. Private tasks don’t need one.' },
  'record.board': { group: 'record', label: 'Leaderboard link', problem: 'a board we read but don’t link', rule: 'Passes when the record links a public leaderboard. Many tests have none, which is fine. Warns when we read a board the record doesn’t link.' },

  'scores.sources': { group: 'scores', public: true, label: 'Independent runs', problem: 'no independent run', rule: 'Passes when someone other than the model’s maker measured scores: the official leaderboard, Epoch AI, or another board Epoch AI copied. An in-house eval can only have its lab’s numbers.' },
  'scores.models': { group: 'scores', public: true, label: 'Models scored', problem: 'fewer than five models', rule: 'Passes with five or more models, enough to rank them.' },
  'scores.recent': { group: 'scores', public: true, label: 'Newest score', problem: 'no new score in six months', rule: 'Passes when a model got a score in the last six months. A test that saturated or was replaced can go quiet.' },
  'scores.frontier': { group: 'scores', public: true, label: 'Frontier models', problem: 'few frontier models tested', rule: 'Passes when at least three of the ten strongest models on Epoch AI’s Capabilities Index have a score here. A retired test or an in-house eval doesn’t need them.' },
  'scores.headroom': { group: 'scores', public: true, label: 'Headroom', problem: 'a saturated test', rule: 'Passes while the best score on a percent test is under 85%. Past that, we count it as saturated, which is a note, not a problem.' },

  'import.importer': { group: 'import', public: true, label: 'Importer', problem: 'a board we don’t read yet', rule: 'Passes when we read the official leaderboard ourselves. A test with no public leaderboard doesn’t need one.' },
  'import.read': { group: 'import', public: true, label: 'Last read', problem: 'a stale read', rule: 'Passes when we read the board in the week before the data’s date.' },
  'import.failed': { group: 'import', public: true, label: 'Read worked', problem: 'a failed leaderboard read', rule: 'Fails when the last attempt to read the board failed. Pages keep the rows from the last good read.' },
  'import.unmatched': { group: 'import', label: 'Names placed', problem: 'model names we couldn’t place', rule: 'Passes when every entry matches a model we track. Warns on names that look like a GPT, Claude, Gemini, Grok or o-series model we couldn’t place, unless the importer says why, such as no snapshot named.' },
  'import.interval': { group: 'import', label: 'Interval meaning', problem: 'an interval we haven’t checked', rule: 'When the board shows a ± interval, passes once we’ve checked what it means on the board’s own pages.' },
  'import.fields': { group: 'import', label: 'Field watch', problem: 'fields the importer may drop', rule: 'Passes when the field watch finds nothing the board publishes that the importer drops.' },

  'consistency.range': { group: 'consistency', label: 'Scores in range', problem: 'scores out of range', rule: 'Fails when a percent score falls below 0 or above 100. Warns when every score is 1 or less, which suggests fractions.' },
  'consistency.units': { group: 'consistency', label: 'Lab units', problem: 'lab numbers in another unit', rule: 'Warns when labs report numbers in a unit other than the benchmark’s, since charts leave those out.' },
  'consistency.duplicates': { group: 'consistency', label: 'Duplicate rows', problem: 'duplicate rows', rule: 'Warns when one source lists the same model, setting, harness and date more than once.' },
  'consistency.claims': { group: 'consistency', public: true, label: 'Lab claims', problem: 'lab numbers far from independent runs', rule: 'Warns when a lab’s number for its own model is more than 10 points (or 10%) from an independent run of the same model, and we have no note on why.' },
  'consistency.direction': { group: 'consistency', label: 'Direction', problem: 'scores that run against the stated direction', rule: 'Stronger models on the capabilities index usually score better. Warns when, across eight or more models, the scores run against the stated direction.' },
  'consistency.dates': { group: 'consistency', label: 'Release date', problem: 'a lab report before the listed release', rule: 'Warns when a lab document reports the benchmark more than a month before its listed release, which suggests a wrong date.' },
  'consistency.issues': { group: 'consistency', public: true, label: 'Known issues', problem: 'an open audit finding', rule: 'Fails while a published audit’s finding is still open. Disputed findings and fixes made only in a copy get a warning.' },
  'consistency.versions': { group: 'consistency', label: 'Versions', problem: 'a missing or misordered successor', rule: 'For a test with several versions, each older version should name the one that replaced it, and come out before it.' },

  'links.main': { group: 'links', label: 'Links respond', problem: 'a broken link', rule: 'From our link check. Fails on a page that’s gone (404, 410 or no such host). Warns on server errors and timeouts. A 403 or 429 usually means bot protection, so it counts as unknown.' },
  'links.evidence': { group: 'links', label: 'Evidence links respond', problem: 'a broken evidence link', rule: 'The same check for the record’s evidence links.' },
};

// ---- optional reports, read from disk -------------------------------------------------------------
// Neither file is imported, so a new link check never reloads the pages a reader has open in `astro dev`. Each is
// read again when its file changes, checked at most once a second.
interface LinkResult {
  status: number;
  ok: boolean | null;
  final?: string;
  note?: string;
  at?: string;
}
interface FieldFlag {
  field: string;
  kind: string;
  why: 'not stored' | 'new';
}
const LINKS_FILE = join(process.cwd(), 'data', 'audits', 'link-health.json');
const FIELDS_FILE = join(process.cwd(), 'data', 'scores', 'field-review.json');
let linkHealth: { checked: string; results: Record<string, LinkResult> } | null = null;
let fieldReview: { updated?: string; boards: Record<string, FieldFlag[]> } | null = null;
let stamp = '';
let stampAt = 0;
const cache = new Map<string, BenchAudit>();

const mtime = (f: string) => (existsSync(f) ? String(statSync(f).mtimeMs) : '');
function readJson<T>(f: string): T | null {
  try {
    return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as T) : null;
  } catch {
    // a file mid-write reads as missing until the next check
    return null;
  }
}
function refresh() {
  const now = Date.now();
  if (now - stampAt < 1000 && stamp) return;
  stampAt = now;
  const s = `${mtime(LINKS_FILE)}|${mtime(FIELDS_FILE)}`;
  if (s === stamp) return;
  stamp = s;
  linkHealth = readJson(LINKS_FILE);
  fieldReview = readJson(FIELDS_FILE);
  cache.clear();
  sitewide = null;
}

/** When the link check last ran, or undefined before its first run. */
export function linksChecked(): string | undefined {
  refresh();
  return linkHealth?.checked;
}

// ---- shared inputs, computed once -----------------------------------------------------------------
type Shared = ReturnType<typeof buildShared>;
let shared: Shared | null = null;

function buildShared() {
  const group = <T>(xs: T[], k: (x: T) => string) => {
    const m = new Map<string, T[]>();
    for (const x of xs) {
      const key = k(x);
      const list = m.get(key);
      if (list) list.push(x);
      else m.set(key, [x]);
    }
    return m;
  };
  // every score row we keep, by benchmark and source: the official board (models, agents and unlisted entries),
  // Epoch AI's own runs, and what Epoch AI collected
  const rows = group([...leaderboardScores, ...systemScores, ...unlistedScores, ...epochScores, ...collectedScores], (s) => s.benchmark);
  // every number a lab document reports on the headline, before the unit filter that leaves some out of charts. A
  // number on another of the benchmark's measures is in that measure's unit by design.
  const labResults = group(
    [...cards, ...systemCards].flatMap((c) => c.results.filter((r) => r.score !== null && !r.measure).map((r) => ({ r, card: c }))),
    (x) => x.r.benchmark,
  );
  // boards whose rows carry an interval
  const withInterval = new Set([...leaderboardScores, ...systemScores, ...unlistedScores].filter((s) => s.info?.low !== undefined && s.info?.high !== undefined).map((s) => s.benchmark));
  // the importer files, by name: a file can exist before its first read
  const dir = join(process.cwd(), 'scripts', 'leaderboards');
  const importers = new Set(existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'types.ts').map((f) => f.replace(/\.ts$/, '')) : []);
  // the versions of each family, oldest first
  const families = group(
    benchmarks.filter((b) => b.family),
    (b) => b.family!,
  );
  for (const xs of families.values()) xs.sort((x, y) => (x.released ?? '').localeCompare(y.released ?? ''));
  const predecessors = group(
    benchmarks.filter((b) => b.successor),
    (b) => b.successor!,
  );
  const eciRank = new Map(eciOrder.map((m, i) => [m, i + 1]));
  return { rows, labResults, withInterval, importers, families, predecessors, eciRank, top10: eciOrder.slice(0, 10) };
}
const sh = () => (shared ??= buildShared());

// ---- helpers --------------------------------------------------------------------------------------
const UNIT_NAME: Record<string, string> = { '%': 'a percent', elo: 'an Elo rating', rating: 'a rating', usd: 'US dollars', minutes: 'minutes', score: 'a plain number', index: 'an index', brier: 'a Brier score', speedup: 'a speedup' };
const SOURCE_NAME: Record<Score['source'], string> = { leaderboard: 'the official leaderboard', epoch: 'Epoch AI’s runs', collected: 'a board Epoch AI copied', card: 'a lab document' };
const nameOf = (s: Pick<Score, 'model' | 'name'>) => (s.model ? (modelById.get(s.model)?.name ?? s.model) : (s.name ?? 'an unlisted entry'));
// "All 25 scores fall", "Both scores fall", or "The one score falls"
const allOf = (n: number, noun: string, one: string, many: string) => (n === 1 ? `The one ${noun} ${one}` : n === 2 ? `Both ${noun}s ${many}` : `All ${count(n, noun)} ${many}`);
const listText = (xs: string[]) => (xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const quoted = (xs: string[]) => xs.map((x) => `“${x}”`);
const cut = (s: string, n = 110) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const urlKey = (u: string) => u.replace(/^https?:\/\/(www\.)?/i, '').replace(/#.*$/, '').replace(/\/+$/, '').toLowerCase();
const ago = (months: number) => (months < 1 ? 'this month' : months === 1 ? 'a month ago' : months < 24 ? `${months} months ago` : `${Math.floor(months / 12)} years ago`);

/** Spearman's rank correlation of two equal-length lists. */
function spearman(xs: number[], ys: number[]): number {
  const rank = (v: number[]) => {
    const order = v.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
    const r = new Array<number>(v.length);
    for (let i = 0; i < order.length; ) {
      let j = i;
      while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
      for (let k = i; k <= j; k++) r[order[k][1]] = (i + j) / 2;
      i = j + 1;
    }
    return r;
  };
  const a = rank(xs);
  const b = rank(ys);
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

// a name that looks like a closed frontier model, which only its maker serves, so we should be able to place it
const FRONTIER_NAME = /\b(gpt[- ]?[345]|gpt-?o|chatgpt|claude|gemini|grok|o[134](-mini|-pro)?)\b/i;
// the importer's own note on why it left a name out: "(snapshot unspecified)", "[snapshot not in registry]"
const LEFT_OUT_WHY = /[([][^)\]]*(unspecified|not in registry|variant|inconsistent|baseline|memory system)[^)\]]*[)\]]/i;
// a board read from a file (a figure, a JSON or CSV feed) rather than a page a reader would open
// or a paper's own tables
const FILE_URL = /\.(png|jpe?g|webp|gif|svg|pdf|json|csv|tsv|parquet|zip|jsonl)(\?|$)|raw\.githubusercontent\.com|\/api\/|arxiv\.org|openreview\.net|aclanthology\.org/i;

// ---- the checks -----------------------------------------------------------------------------------
export function auditOf(id: string): BenchAudit {
  refresh();
  const hit = cache.get(id);
  if (hit) return hit;
  const b = benchById.get(id);
  if (!b) throw new Error(`unknown benchmark ${id}`);
  const s = benchSummary(id);
  const x = sh();
  const checks: AuditCheck[] = [];
  const add = (key: string, status: AuditStatus, detail: string) => checks.push({ group: CHECKS[key].group, key, status, label: CHECKS[key].label, detail });

  const unit = b.unit ?? '%';
  const arena = isArena(b);
  const board = LEADERBOARDS[id];
  const links = b.links ?? {};
  const evidence = ((b as Benchmark & { evidence?: string[] }).evidence ?? []).filter(Boolean);
  // an eval only its maker can run: private tasks, no public board, reported in lab documents
  const inHouse = b.access === 'private' && !board && !links.leaderboard;
  const pct = unit === '%';
  const higher = b.better !== 'lower';
  const best = s.frontier.at(-1);
  const saturated = pct && higher && !!s.saturatedAt;
  const retired = !!b.successor || s.why === 'saturated' || s.why === 'replaced' || saturated;
  const fam = b.family ? (x.families.get(b.family) ?? [b]) : [b];

  // -- catalog record
  const desc = (b.description ?? '').trim();
  add('record.description', !desc ? 'fail' : desc.length < 40 ? 'warn' : 'pass', !desc ? 'No description.' : desc.length < 40 ? `Only ${desc.length} characters, too short to say what it tests.` : `${desc.length} characters.`);
  add('record.maker', b.org ? 'pass' : 'warn', b.org ? `${b.org}.` : 'No maker named.');
  add(
    'record.released',
    /^\d{4}-\d{2}/.test(b.released ?? '') ? 'pass' : 'warn',
    /^\d{4}-\d{2}/.test(b.released ?? '') ? `${longMonthYear(b.released)}.` : b.released ? `Only the year, ${b.released}.` : 'No release date.',
  );
  const catName = CATEGORY_NAMES[b.category ?? ''] ?? 'Other';
  const sub = b.subcategory ? SUB_BY_ID.get(b.subcategory) : undefined;
  add(
    'record.kind',
    !b.category || b.category === 'other' ? 'warn' : sub ? 'pass' : 'warn',
    !b.category || b.category === 'other' ? 'Filed under Other.' : sub ? `${catName}, ${lowerLabel(sub.name)}.` : `${catName}, with no finer kind.`,
  );
  const level = b.level ? LEVEL_BY_ID.get(b.level) : undefined;
  add('record.level', level ? 'pass' : arena ? 'info' : 'warn', level ? `${level.name}.` : arena ? 'Doesn’t apply to a ranking by votes or matches.' : 'No level.');
  const scoring = b.scoring ? SCORING_BY_ID.get(b.scoring) : undefined;
  add('record.scoring', scoring ? 'pass' : 'warn', scoring ? `${scoring.name}.` : 'No scoring method.');
  const format = b.format ? FORMAT_BY_ID.get(b.format) : undefined;
  add('record.format', format ? 'pass' : 'warn', format ? `${format.name}.` : 'No answer format.');
  const ACCESS: Record<string, string> = { public: 'All tasks are public.', 'public+private-holdout': 'Public tasks, plus a private test set.', private: 'The tasks are private.' };
  add('record.access', b.access && ACCESS[b.access] ? 'pass' : 'warn', (b.access && ACCESS[b.access]) || 'We don’t know whether the tasks are public.');
  add(
    'record.unit',
    !b.unit || !b.better ? 'warn' : 'pass',
    !b.unit
      ? 'No unit, so pages assume a percent.'
      : !b.better
        ? `Scored as ${UNIT_NAME[unit] ?? unit}, but the record doesn’t say which way is better, so pages assume higher.`
        : `Scored as ${UNIT_NAME[unit] ?? unit}, and ${b.better} is better.`,
  );
  add(
    'record.confidence',
    b.confidence === 'verified' ? 'pass' : b.confidence === 'likely' ? 'warn' : 'fail',
    b.confidence === 'verified' ? 'Checked against a primary source.' : b.confidence === 'likely' ? 'Likely. Some facts rest on secondary sources.' : 'Unverified. We haven’t checked it against a primary source yet.',
  );
  add('record.evidence', evidence.length ? 'pass' : 'warn', evidence.length ? `${count(evidence.length, 'source')} listed.` : 'No sources listed for its facts.');
  add(
    'record.paper',
    links.paper || links.site ? 'pass' : inHouse ? 'info' : 'warn',
    links.paper ? `Paper on ${hostname(links.paper)}.` : links.site ? `Site at ${hostname(links.site)}.` : inHouse ? 'An in-house eval that lab documents describe.' : 'No paper or site linked.',
  );
  add(
    'record.code',
    links.repo || links.dataset ? 'pass' : b.access === 'private' ? 'info' : 'warn',
    links.repo || links.dataset
      ? `${[links.repo && `Code on ${hostname(links.repo)}`, links.dataset && `${links.repo ? 'data' : 'Data'} on ${hostname(links.dataset)}`].filter(Boolean).join(', ')}.`
      : b.access === 'private'
        ? 'The tasks are private, so there’s nothing to link.'
        : 'No code or dataset linked.',
  );
  {
    const own = board && Object.values(links).some((u) => u && urlKey(u) === urlKey(board.url));
    add(
      'record.board',
      links.leaderboard || own ? 'pass' : board && !FILE_URL.test(board.url) ? 'warn' : 'info',
      links.leaderboard
        ? `On ${hostname(links.leaderboard)}.`
        : own
          ? `We read its board at ${hostname(board.url)}, which the record links.`
          : board && !FILE_URL.test(board.url)
            ? `We read a board at ${hostname(board.url)}, but the record doesn’t link it.`
            : board
              ? `We read its scores from ${/arxiv|openreview|aclanthology/.test(board.url) ? 'a paper’s tables' : 'a file'} on ${hostname(board.url)}, with no board page to link.`
              : 'No public leaderboard linked.',
    );
  }

  // -- scores
  const official = s.leaderboardBoard.length + s.systems.length + s.unlisted.length;
  const launchScored = s.cites.filter((c) => c.score !== null).length;
  const docScored = s.docCites.filter((c) => c.score !== null).length;
  const sources = [
    official && `the official leaderboard (${count(official, 'entry', 'entries')})`,
    s.epochBoard.length && `Epoch AI’s runs (${count(s.epochBoard.length, 'model')})`,
    s.viaBoard.length && `boards Epoch AI copied (${count(s.viaBoard.length, 'model')})`,
    launchScored && `launch posts (${count(launchScored, 'score')})`,
    docScored && `system cards (${count(docScored, 'score')})`,
    s.claimBoard.length && `claims Epoch AI collected (${count(s.claimBoard.length, 'model')})`,
  ].filter((v): v is string => !!v);
  const independent = official + s.epochBoard.length + s.viaBoard.length > 0;
  const anyScore = sources.length > 0;
  add(
    'scores.sources',
    // how widely a test has been run is coverage, not an error in our data, so it's a note (2026-11-18)
    independent ? 'pass' : !anyScore ? 'warn' : 'info',
    !anyScore
      ? 'No scores from any source yet.'
      : `${independent ? 'Scores' : inHouse ? 'Only labs’ own numbers, as expected for an in-house eval. Scores' : 'Only labs’ own numbers, so no one else has checked them. Scores'} from ${listText(sources)}.`,
  );
  const extra = s.unlisted.length + s.systems.length;
  add(
    'scores.models',
    s.nScores >= 5 || (s.nScores + extra >= 5 && official > 0) ? 'pass' : 'info',
    s.nScores + extra === 0
      ? 'No models scored yet.'
      : !s.nScores
        ? `${count(extra, 'entry', 'entries')} on its leaderboard, none a model we track.`
        : `${s.nScores + extra >= 5 ? '' : 'Only '}${count(s.nScores, 'model')} we track${extra ? `, plus ${count(extra, 'other entry', 'other entries')} on its leaderboard` : ''}.`,
  );
  if (!s.lastAdded) add('scores.recent', 'info', 'No scores yet.');
  else {
    const m = monthsBetween(s.lastAdded.date, AS_OF);
    const who = s.lastAdded.model ? (modelById.get(s.lastAdded.model)?.name ?? s.lastAdded.model) : '';
    const what = `The newest is from ${longMonthYear(s.lastAdded.date)}${who ? `, for ${who}` : ''}`;
    // quiet is expected for a retired test, an in-house eval, or a test labs stopped reporting that no one else runs
    const expected = retired || inHouse || (!independent && s.status === 'dropped');
    const why = b.successor
      ? ` That’s expected for a test replaced by ${benchById.get(b.successor)?.name ?? b.successor}.`
      : saturated || s.why === 'saturated'
        ? ' That’s expected for a saturated test.'
        : inHouse
          ? ' Only the lab that runs it can add scores.'
          : !independent && s.status === 'dropped'
            ? ' Labs stopped reporting it, and no one else runs it.'
            : '';
    const old = `The newest came ${ago(m)}, in ${longMonthYear(s.lastAdded.date)}${who ? `, for ${who}` : ''}.`;
    add('scores.recent', m < 6 ? 'pass' : expected ? 'info' : 'warn', m < 6 ? `${what}.` : `${old}${why}`);
  }
  {
    const scored = new Set([...s.board, ...s.leaderboardBoard, ...s.epochBoard, ...s.viaBoard, ...s.cardBoard, ...s.claimBoard].map((v) => v.model).filter(Boolean));
    const ranked = [...scored].filter((m) => x.eciRank.has(m)).sort((p, q) => x.eciRank.get(p)! - x.eciRank.get(q)!);
    const inTop = x.top10.filter((m) => scored.has(m));
    const strongest = ranked[0];
    const lead = strongest ? `${modelById.get(strongest)?.name ?? strongest} (#${x.eciRank.get(strongest)})` : '';
    if (!scored.size) add('scores.frontier', 'info', 'No models scored yet.');
    else if (!strongest) add('scores.frontier', 'info', 'None of its models are on the capabilities index.');
    else if (inTop.length >= 3) add('scores.frontier', 'pass', `${inTop.length} of the top 10 have a score, led by ${lead}.`);
    else if (retired || inHouse)
      add('scores.frontier', 'info', `${inTop.length ? `${inTop.length} of the top 10 ${inTop.length === 1 ? 'has' : 'have'}` : 'None of the top 10 has'} a score, which is fine for ${inHouse ? 'an in-house eval' : 'a retired test'}. The strongest tested is ${lead}.`);
    else add('scores.frontier', 'info', `${inTop.length ? `Only ${inTop.length} of the top 10 ${inTop.length === 1 ? 'has' : 'have'}` : 'None of the top 10 has'} a score. The strongest tested is ${lead}.`);
  }
  if (!pct || !higher) add('scores.headroom', 'info', pct ? 'Lower is better, so there’s no ceiling to reach.' : `Scored as ${UNIT_NAME[unit] ?? unit}, with no fixed ceiling.`);
  else if (!best) add('scores.headroom', 'info', 'No scores yet.');
  else if (saturated) add('scores.headroom', 'info', `Saturated. The best is ${fmt(best.value, unit)}, past 85% since ${longMonthYear(s.saturatedAt)}.`);
  else add('scores.headroom', 'pass', `The best is ${fmt(best.value, unit)}, under ${SATURATED}%, so it still separates models.`);

  // -- leaderboard import
  if (board) {
    const where = board.host ?? hostname(board.url);
    const others = s.unlisted.length;
    add(
      'import.importer',
      board.rows + others > 0 ? 'pass' : 'warn',
      board.rows + others === 0
        ? `We read the board on ${where}, but it gave no rows.`
        : !board.rows
          ? `We read the board on ${where}: ${count(others, 'entry', 'entries')} at the last read, none a model we track.`
          : `We read the board on ${where}: ${count(board.rows, 'row')} for models we track${others ? ` and ${count(others, 'other entry', 'other entries')}` : ''} at the last read.`,
    );
    const days = daysBetween(board.retrieved, AS_OF);
    add('import.read', days <= 7 ? 'pass' : 'warn', days <= 7 ? `${humanDate(board.retrieved)}.` : `${humanDate(board.retrieved)}, ${count(days, 'day')} before the data’s date.`);
    add(
      'import.failed',
      board.failed ? 'fail' : 'pass',
      board.failed ? `The read on ${humanDate(board.failed.date)} failed with “${cut(board.failed.error)}”. Pages show the rows from ${humanDate(board.retrieved)}.` : 'The last read worked.',
    );
    const um = board.unmatched ?? [];
    const look = um.filter((n) => FRONTIER_NAME.test(n) && !LEFT_OUT_WHY.test(n));
    add(
      'import.unmatched',
      !um.length ? 'pass' : look.length ? 'warn' : 'info',
      !um.length
        ? 'Every entry matches a model we track.'
        : look.length
          ? `${count(look.length, 'name')} ${look.length === 1 ? 'looks' : 'look'} like a model we track but stayed unplaced, such as ${listText(quoted(look.slice(0, 3)))}.`
          : `${count(um.length, 'entry', 'entries')} ${um.length === 1 ? 'is' : 'are'} outside our model list, shown under the board’s own name.`,
    );
    const iv = INTERVALS[id];
    if (x.withInterval.has(id))
      add(
        'import.interval',
        iv && iv.says !== 'not found' ? 'pass' : 'warn',
        iv && iv.says !== 'not found'
          ? `${(intervalName(id) ?? iv.kind).replace(/^./, (c) => c.toUpperCase())}, ${iv.says === 'stated' ? 'as the board states' : iv.says === 'implied' ? 'as the board implies' : 'as we inferred it'}.`
          : iv
            ? 'The board shows ± intervals but doesn’t say what they are.'
            : 'The board shows ± intervals, and we haven’t checked what they mean.',
      );
    else add('import.interval', 'info', 'The board shows no intervals.');
    if (fieldReview) {
      const flags = fieldReview.boards?.[id] ?? [];
      add(
        'import.fields',
        flags.length ? 'warn' : 'pass',
        flags.length
          ? `${count(flags.length, 'field')} to review, such as ${listText(flags.slice(0, 3).map((f) => `${f.kind} (“${f.field}”)`))}.`
          : `Nothing flagged at the last sync${fieldReview.updated ? `, ${humanDate(fieldReview.updated)}` : ''}.`,
      );
    }
  } else if (x.importers.has(id)) add('import.importer', 'warn', 'An importer exists, but it hasn’t read the board yet.');
  else if (links.leaderboard) {
    const why = unreadWhy(links.leaderboard);
    add('import.importer', why ? 'info' : 'warn', why ?? `The record links a board on ${hostname(links.leaderboard)} that we don’t read yet.`);
  } else add('import.importer', 'info', 'No public leaderboard to read.');

  // -- consistency
  const rows = x.rows.get(id) ?? [];
  if (!rows.length) add('consistency.range', 'info', 'No leaderboard or Epoch AI rows to check.');
  else if (!pct) add('consistency.range', 'info', `Scored as ${UNIT_NAME[unit] ?? unit}, with no fixed range.`);
  else {
    // a return, a growth rate or a change in percent can be negative or pass 100: only an accuracy-like percent can't
    const signed = /\b(return|returns|growth|profit|bankroll|gain|change|lift|relative|improvement|speedup|below zero)\b/i.test(`${b.description ?? ''} ${b.note ?? ''}`);
    const out = rows.filter((r) => (signed ? r.value < -100 : r.value < 0) || (!signed && r.value > 100));
    const fraction = rows.length >= 5 && rows.every((r) => r.value <= 1) && rows.some((r) => r.value > 0);
    add(
      'consistency.range',
      out.length ? 'fail' : fraction ? 'warn' : signed ? 'info' : 'pass',
      out.length
        ? `${count(out.length, 'score')} ${out.length === 1 ? 'falls' : 'fall'} outside 0 to 100, such as ${out[0].value.toLocaleString('en-US')} for ${nameOf(out[0])} on ${SOURCE_NAME[out[0].source]}.`
        : fraction
          ? `Every one of ${count(rows.length, 'score')} is 1 or less, so the source may give fractions, not percents.`
          : signed
            ? 'The score is signed, like a return, so values below 0 or above 100 are fine.'
            : `${allOf(rows.length, 'score', 'falls', 'fall')} between 0 and 100.`,
    );
  }
  {
    const lab = x.labResults.get(id) ?? [];
    const off = lab.filter(({ r }) => normUnit(r.unit) !== unit || (pct && ((r.score as number) < 0 || (r.score as number) > 100)));
    const units = [...new Set(off.map(({ r }) => (r.unit ?? '').trim() || 'no unit'))];
    add(
      'consistency.units',
      !lab.length ? 'info' : off.length ? 'warn' : 'pass',
      !lab.length
        ? 'No lab documents report a number.'
        : off.length
          ? `${off.length} of ${count(lab.length, 'lab number')} ${off.length === 1 ? 'is' : 'are'} in ${listText(quoted(units.slice(0, 3)))}, not ${UNIT_NAME[unit] ?? unit}, so charts leave ${off.length === 1 ? 'it' : 'them'} out.`
          : `${allOf(lab.length, 'lab number', 'uses', 'use')} the benchmark’s unit.`,
    );
  }
  if (!rows.length) add('consistency.duplicates', 'info', 'No leaderboard or Epoch AI rows to check.');
  else {
    const seen = new Map<string, Score[]>();
    for (const r of rows) {
      const k = [r.source, r.via ?? '', r.model || `~${r.name}`, r.setting ?? '', r.harness ?? '', r.info?.run ?? r.date ?? '', r.system ?? '', (r.info?.models ?? []).join('+')].join('|');
      const list = seen.get(k);
      if (list) list.push(r);
      else seen.set(k, [r]);
    }
    const dup = [...seen.values()].filter((v) => v.length > 1);
    const first = dup[0];
    add(
      'consistency.duplicates',
      dup.length ? 'warn' : 'pass',
      dup.length
        ? `${count(dup.length, 'run')} ${dup.length === 1 ? 'appears' : 'appear'} more than once, such as ${nameOf(first[0])} on ${SOURCE_NAME[first[0].source]} (${listText([...new Set(first.map((r) => fmt(r.value, unit)))])}).`
        : rows.length === 1 ? 'Only one row, so nothing repeats.' : `No repeats among ${count(rows.length, 'row')}.`,
    );
  }
  {
    const pairs = claimsForBenchmark(id);
    const far = pairs.filter((p) => !p.same && (p.unit === '%' ? Math.abs(p.gap) > 10 : Math.abs(p.gap) / Math.max(Math.abs(p.claim.value), Math.abs(p.board.value), 1e-9) > 0.1));
    const open = far.filter((p) => !claimNote(p));
    const big = open[0] ?? far[0];
    add(
      'consistency.claims',
      !pairs.length ? 'info' : open.length ? 'warn' : far.length ? 'info' : 'pass',
      !pairs.length
        ? 'No model has both a lab number and an independent run.'
        : open.length
          ? `${open.length} of ${count(pairs.length, 'pair')} ${open.length === 1 ? 'differs' : 'differ'} by more than 10 points, the largest for ${modelById.get(big.model)?.name ?? big.model} (${gapText(big)}).`
          : far.length
            ? `${count(far.length, 'large gap')} of ${count(pairs.length, 'pair')}, each explained in our notes.`
            : `${allOf(pairs.length, 'pair', 'agrees', 'agree')} within 10 points.`,
    );
  }
  {
    const withEci = s.board.filter((v) => v.model && eciByModel.has(v.model));
    if (withEci.length < 8) add('consistency.direction', 'info', `Too few models on the capabilities index to tell (${withEci.length} of 8 needed).`);
    else {
      const rho = spearman(
        withEci.map((v) => eciByModel.get(v.model)!.eci),
        withEci.map((v) => v.value),
      );
      const r2 = (Math.round(rho * 100) / 100).toFixed(2).replace('-', '−');
      const against = higher ? rho < -0.4 : rho > 0.4;
      const along = higher ? rho > 0.3 : rho < -0.3;
      add(
        'consistency.direction',
        against ? 'warn' : along ? 'pass' : 'info',
        against
          ? `Stronger models score ${higher ? 'lower' : 'higher'} here (correlation ${r2} over ${withEci.length} models), so ${higher ? 'lower' : 'higher'} may be better.`
          : along
            ? `Stronger models score ${higher ? 'higher' : 'lower'}, as stated (correlation ${r2} over ${withEci.length} models).`
            : `Scores barely follow the capabilities index (correlation ${r2} over ${withEci.length} models), so we can’t tell.`,
      );
    }
  }
  {
    const docs = [...s.cites.map((c) => c.card), ...s.docCites.map((c) => c.card)].sort((p, q) => p.date.localeCompare(q.date));
    const rel = /^\d{4}-\d{2}/.test(b.released ?? '') ? b.released!.slice(0, 7) : '';
    const early = rel ? docs.find((c) => monthsBetween(c.date, `${rel}-01`) > 1) : undefined;
    add(
      'consistency.dates',
      !rel || !docs.length ? 'info' : early ? 'warn' : 'pass',
      !rel
        ? 'No release month to compare with.'
        : !docs.length
          ? 'No lab documents report it.'
          : early
            ? `${modelById.get(early.model)?.name ?? early.model}’s ${early.kind === 'system-card' ? (early.doc ?? 'system card') : 'launch post'} reported it in ${longMonthYear(early.date)}, before its listed release in ${longMonthYear(rel)}.`
            : `No lab document reports it before ${longMonthYear(rel)}.`,
    );
  }
  {
    const issues = issuesByBenchmark.get(id) ?? [];
    const open = issues.filter((i) => i.finding.status === 'open');
    const soft = issues.filter((i) => i.finding.status === 'disputed' || i.finding.status === 'fixed-in-fork');
    const kinds = (xs: typeof issues) => listText([...new Set(xs.flatMap((i) => i.finding.problems))].map((p, k) => (k ? PROBLEMS[p].name.toLowerCase() : PROBLEMS[p].name)));
    add(
      'consistency.issues',
      open.length ? 'fail' : soft.length ? 'warn' : 'pass',
      open.length
        ? `${count(open.length, 'open finding')}: ${kinds(open)}.`
        : soft.length
          ? `${count(soft.length, 'finding')} disputed or fixed only in a copy: ${kinds(soft)}.`
          : issues.length
            ? `${count(issues.length, 'finding')}, all fixed.`
            : 'No published audit found problems.',
    );
  }
  {
    const succ = b.successor ? benchById.get(b.successor) : undefined;
    const pred = x.predecessors.get(id) ?? [];
    const i = fam.findIndex((v) => v.id === id);
    const newer = fam.length > 1 && i < fam.length - 1;
    const after = succ && b.released && succ.released && succ.released < b.released;
    if (fam.length < 2 && !succ && !pred.length) add('consistency.versions', 'info', 'No other versions on file.');
    else if (after) add('consistency.versions', 'warn', `Its successor ${succ.name} came out in ${longMonthYear(succ.released)}, before it.`);
    else if (newer && !succ) add('consistency.versions', 'warn', `${b.name} is older than ${fam[fam.length - 1].name} but doesn’t name a successor.`);
    else
      add(
        'consistency.versions',
        'pass',
        succ ? `Replaced by ${succ.name}.` : fam.length > 1 ? `The newest of ${fam.length} versions.` : `Replaces ${listText(pred.map((p) => p.name))}.`,
      );
  }

  // -- links
  if (linkHealth) {
    const judge = (key: string, urls: string[], what: string) => {
      if (!urls.length) return;
      const res = urls.map((u) => [u, linkHealth!.results[u]] as const);
      const isGone = (r: LinkResult) => r.status === 404 || r.status === 410 || (r.status === 0 && /no such host/i.test(r.note ?? ''));
      const gone = res.filter(([, r]) => r && r.ok === false && isGone(r));
      const errOnly = res.filter(([, r]) => r && r.ok === false && !isGone(r));
      const unknown = res.filter(([, r]) => r && r.ok === null);
      const unchecked = res.filter(([, r]) => !r);
      const ok = res.filter(([, r]) => r?.ok === true);
      const one = (u: string, r: LinkResult) => `${hostname(u)} ${r.status ? `returns ${r.status}` : `(${cut((r.note ?? 'no response').replace(/\s*\((.*)\)$/, ', $1'), 60)})`}`;
      if (gone.length) add(key, 'fail', `${gone.length} of ${count(urls.length, what)} ${gone.length === 1 ? 'is' : 'are'} gone: ${listText(gone.slice(0, 2).map(([u, r]) => one(u, r!)))}.`);
      else if (errOnly.length) add(key, 'warn', `${errOnly.length} of ${count(urls.length, what)} failed at the last check: ${listText(errOnly.slice(0, 2).map(([u, r]) => one(u, r!)))}.`);
      else if (unchecked.length === urls.length) add(key, 'info', `Not checked yet (${count(urls.length, what)}).`);
      else if (unknown.length || unchecked.length)
        add(key, 'info', `${ok.length} of ${count(urls.length, what)} respond.${unknown.length ? ` ${unknown.length} ${unknown.length === 1 ? 'blocks' : 'block'} automated checks, so we can’t tell.` : ''}${unchecked.length ? ` ${unchecked.length} not checked yet.` : ''}`);
      else add(key, 'pass', `${allOf(urls.length, what, 'responds', 'respond')}.`);
    };
    judge('links.main', [...new Set(Object.values(links).filter((u): u is string => !!u))], 'link');
    judge('links.evidence', [...new Set(evidence)], 'link');
  }

  const shown = ALL_CHECKS ? checks : checks.filter((c) => CHECKS[c.key].public);
  // the count is of the public checks only, so it reads the same on localhost as on the site
  const out: BenchAudit = { id, checks: shown, summary: summarize(shown.filter((c) => CHECKS[c.key].public)) };
  cache.set(id, out);
  return out;
}

export function summarize(checks: Pick<AuditCheck, 'status'>[]): AuditSummary {
  const n = (st: AuditStatus) => checks.filter((c) => c.status === st).length;
  const [pass, warn, fail, info] = [n('pass'), n('warn'), n('fail'), n('info')];
  const checked = pass + warn + fail;
  const text =
    pass === checked
      ? `All ${count(checked, 'check')} pass`
      : [`${pass} of ${count(checked, 'check')} pass`, warn && count(warn, 'warning'), fail && count(fail, 'problem')].filter(Boolean).join(', ');
  return { pass, warn, fail, info, checked, text };
}

// which group's findings come first: numbers that disagree, then the import, the links and the record, which we can
// fix ourselves, then score coverage, which mostly waits on others to run the test
const FIRST: AuditGroup[] = ['consistency', 'import', 'links', 'record', 'scores'];
/** The check a reader should see first: a problem before a warning, and within each, by FIRST. */
export function worstCheck(a: BenchAudit): AuditCheck | undefined {
  for (const st of ['fail', 'warn'] as const)
    for (const g of FIRST) {
      const hit = a.checks.find((c) => c.status === st && c.group === g && CHECKS[c.key].public);
      if (hit) return hit;
    }
  return undefined;
}

// ---- site-wide totals -----------------------------------------------------------------------------
export interface CheckTotal {
  key: string;
  group: AuditGroup;
  label: string;
  rule: string;
  problem: string;
  pass: number;
  warn: number;
  fail: number;
  info: number;
}
let sitewide: { audits: BenchAudit[]; totals: CheckTotal[] } | null = null;

/** Every benchmark's audit, and the totals per check, in the registry's order. */
export function allAudits() {
  refresh();
  if (sitewide) return sitewide;
  const audits = benchmarks.map((b) => auditOf(b.id));
  const totals = new Map<string, CheckTotal>(Object.entries(CHECKS).map(([key, c]) => [key, { key, ...c, pass: 0, warn: 0, fail: 0, info: 0 }]));
  for (const a of audits) for (const c of a.checks) totals.get(c.key)![c.status]++;
  sitewide = { audits, totals: [...totals.values()].filter((t) => t.pass + t.warn + t.fail + t.info > 0) };
  return sitewide;
}
