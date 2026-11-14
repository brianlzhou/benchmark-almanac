// Turns an accepted issue form into a data change. scripts/accept.ts runs it when a maintainer adds the
// "accepted" label: it reads the issue, and this file decides the edit and writes the new file contents. Nothing
// here touches the disk or the network, so the tests can run it on made-up data.
//
// Issue text is untrusted. It is only ever read as data: every value is checked against an allowed shape
// (https links, dates, known ids, short plain text) before it reaches a record, and nothing in it is run.
import { key, slug } from './util.ts';

export type Kind = 'benchmark' | 'critique' | 'maintainer' | 'score' | 'correction' | 'bug' | 'idea';

type Obj = Record<string, unknown>;
export interface Benchmark extends Obj {
  id: string;
  name: string;
  aliases?: string[] | null;
  links?: Record<string, string> | null;
  family?: string | null;
  successor?: string | null;
}
export interface Model extends Obj {
  id: string;
  name: string;
  aliases?: string[] | null;
}
export interface Lab extends Obj {
  id: string;
  name: string;
}
export interface Result extends Obj {
  benchmark: string;
  score: number | null;
  unit: string;
  as_written: string;
  section?: string;
}
export interface Doc extends Obj {
  id: string;
  model: string;
  url: string;
  title?: string;
  results: Result[];
}
export interface Finding extends Obj {
  benchmark: string;
  problems: string[];
  summary: string;
  status: string;
}
export interface Audit extends Obj {
  id: string;
  title: string;
  author: string;
  date: string;
  url: string;
  source: 'write-up' | 'paper';
  findings: Finding[];
}
export interface Reviewed {
  added: { id: string; date: string; via: string }[];
  rejected: Obj[];
}

/** The data the bot can edit. Launch posts and system cards also come as text, because the bot splices them. */
export interface Data {
  benchmarks: Benchmark[];
  models: Model[];
  labs: Lab[];
  cards: Doc[];
  cardsText: string;
  systemCards: Doc[];
  systemCardsText: string;
  audits: Audit[];
  reviewed: Reviewed;
}

export interface Issue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  url?: string;
}

export interface Outcome {
  kind: Kind | 'unknown';
  /** 'pr' opens a pull request with `files`; 'comment' only replies on the issue. */
  action: 'pr' | 'comment';
  draft?: boolean;
  title?: string;
  /** What changed, one line each, for the pull request body. */
  changes: string[];
  /** Things a maintainer should check or finish in the pull request. */
  todo: string[];
  /** New contents by path under the repository root, such as "data/benchmarks.json". */
  files: Record<string, string>;
  /** The reply on the issue when there is no pull request. */
  comment?: string;
}

// ---- reading a form -------------------------------------------------------------------------------

/** An issue form body: "### Label" sections. Empty answers read "_No response_". */
export function parseForm(body: string): Map<string, string> {
  const out = new Map<string, string>();
  const parts = body.replace(/\r\n/g, '\n').split(/^### /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const label = (nl < 0 ? part : part.slice(0, nl)).trim();
    const value = nl < 0 ? '' : part.slice(nl + 1).trim();
    if (!label || !value || value === '_No response_') continue;
    out.set(label, value);
  }
  return out;
}

/** The ticked boxes of a checkbox field, by their text up to the first period. */
export function ticked(value: string | undefined): string[] {
  return [...(value ?? '').matchAll(/^- \[[xX]\] (.+)$/gm)].map((m) => m[1].trim());
}

const FORM_LABELS: Record<string, Kind> = {
  submission: 'benchmark',
  critique: 'critique',
  maintainer: 'maintainer',
  score: 'score',
  correction: 'correction',
  bug: 'bug',
  idea: 'idea',
};
const FORM_TITLES: [RegExp, Kind][] = [
  [/^Benchmark:/i, 'benchmark'],
  [/^Critique:/i, 'critique'],
  [/^Maintainer:/i, 'maintainer'],
  [/^Score:/i, 'score'],
  [/^Correction:/i, 'correction'],
  [/^Bug:/i, 'bug'],
  [/^Idea:/i, 'idea'],
];

/** Which form an issue came from: its form label, or the title prefix the form sets. */
export function formOf(labels: string[], title: string): Kind | undefined {
  for (const l of labels) if (FORM_LABELS[l]) return FORM_LABELS[l];
  return FORM_TITLES.find(([re]) => re.test(title))?.[1];
}

// ---- checking values ------------------------------------------------------------------------------

/** One line of plain text: no control characters, single spaces, at most `max` characters. */
export function plain(s: string | undefined, max = 200): string | undefined {
  if (!s) return undefined;
  const t = s
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t || t.length > max) return undefined;
  return t;
}

/** A name: letters, digits, spaces and the punctuation names use. No backticks, quotes, $, braces or angle brackets. */
export function nameText(s: string | undefined, max = 120): string | undefined {
  const t = plain(s, max);
  return t && /^[\p{L}\p{N}\p{M} .,:'’&+\-–()\/!?_#%²]+$/u.test(t) ? t : undefined;
}

/** Prose in the house style: sentences, no semicolons, no dashes as punctuation, no middle dots. */
export function prose(s: string | undefined, max = 800): string | undefined {
  let t = plain(s?.replace(/\n+/g, ' '), max * 2);
  if (!t) return undefined;
  t = t
    .replace(/\s+(?:—|–|--)\s+/g, ', ')
    .replace(/\s*·\s*/g, ', ')
    .replace(/\s*;\s*([a-z])/g, (_, c: string) => `. ${c.toUpperCase()}`)
    .replace(/\s*;\s*/g, '. ')
    .replace(/\s+([.,])/g, '$1');
  if (!/[.!?]$/.test(t)) t += '.';
  return t.length <= max ? t : undefined;
}

/** An https link with no credentials, trimmed of trailing punctuation. */
export function https(s: string | undefined): string | undefined {
  const m = (s ?? '').match(/https:\/\/[^\s<>"'`]+/);
  if (!m) return undefined;
  const raw = m[0].replace(/[).,;:!?\]]+$/, '');
  if (raw.length > 500) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password || !u.hostname.includes('.')) return undefined;
    return raw;
  } catch {
    return undefined;
  }
}

/** Every https link in a text, at most `max`. */
export function links(s: string | undefined, max = 10): string[] {
  const out: string[] = [];
  for (const m of (s ?? '').matchAll(/https:\/\/[^\s<>"'`]+/g)) {
    const u = https(m[0]);
    if (u && !out.includes(u)) out.push(u);
    if (out.length >= max) break;
  }
  return out;
}

/** A release month (YYYY-MM) from "2025-07" or "2025-07-14". */
export function month(s: string | undefined): string | undefined {
  const m = (s ?? '').trim().match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (!m) return undefined;
  const mo = Number(m[2]);
  const y = Number(m[1]);
  if (mo < 1 || mo > 12 || y < 1950 || y > 2100) return undefined;
  return `${m[1]}-${String(mo).padStart(2, '0')}`;
}

/** A link reduced to what identifies it, so http, www, a trailing slash and a fragment don't matter. */
export function sameLink(a: string, b: string): boolean {
  const norm = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/#.*$/, '').replace(/\/+$/, '');
  return norm(a) === norm(b);
}

/** Shows a value from the issue in Markdown without letting it format or mention anyone. */
export function shown(v: unknown): string {
  const s = String(typeof v === 'string' ? v : JSON.stringify(v)).replace(/`/g, "'").replace(/\s+/g, ' ').slice(0, 300);
  return `\`${s}\``;
}

// ---- finding records ------------------------------------------------------------------------------

export interface Match<T> {
  record?: T;
  candidates: T[];
}

function matchByName<T extends { id: string; name: string; aliases?: string[] | null }>(text: string, list: T[], path: string): Match<T> {
  const t = (text ?? '').trim();
  if (!t) return { candidates: [] };
  // a link to the almanac's own page names the record exactly
  const page = t.match(new RegExp(`/${path}/([a-z0-9][a-z0-9-]*)/?`));
  if (page) {
    const r = list.find((x) => x.id === page[1]);
    if (r) return { record: r, candidates: [r] };
  }
  const exact = list.find((x) => x.id === t.toLowerCase());
  if (exact) return { record: exact, candidates: [exact] };
  const k = key(t);
  if (!k) return { candidates: [] };
  const hits = list.filter((x) => key(x.name) === k || (x.aliases ?? []).some((a) => key(a) === k));
  return hits.length === 1 ? { record: hits[0], candidates: hits } : { candidates: hits };
}
export const findBenchmark = (text: string, data: Pick<Data, 'benchmarks'>) => matchByName(text, data.benchmarks, 'benchmarks');
export const findModel = (text: string, data: Pick<Data, 'models'>) => matchByName(text, data.models, 'models');

// ---- writing files --------------------------------------------------------------------------------

/** The house JSON format: two-space indent and a final newline. */
export const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;

/** The JSON text of one result row, indented to sit inside a record's "results" list. */
function rowText(row: Result): string {
  return JSON.stringify(row, null, 2)
    .split('\n')
    .map((l) => `      ${l}`)
    .join('\n');
}

/**
 * Adds a result to one record of cards.json or system-cards.json, or replaces the score of an existing one, by
 * editing the text in place. Those files keep numbers like 67.0, which a full rewrite would turn into 67, so a
 * rewrite would touch thousands of lines. The new text must parse to exactly the expected data, or this throws.
 */
export function spliceResult(text: string, docs: Doc[], docId: string, row: Result): string {
  const idAt = text.indexOf(`\n    "id": ${JSON.stringify(docId)},`);
  if (idAt < 0 || text.indexOf(`\n    "id": ${JSON.stringify(docId)},`, idAt + 1) >= 0) throw new Error(`record ${docId} not found once`);
  const start = text.indexOf('\n    "results": [', idAt);
  const nextRecord = text.indexOf('\n  }', idAt);
  if (start < 0 || (nextRecord >= 0 && start > nextRecord)) throw new Error(`record ${docId} has no results list`);
  const open = start + '\n    "results": ['.length;
  let out: string;
  const existing = docs.find((d) => d.id === docId)!.results.findIndex((r) => r.benchmark === row.benchmark);
  if (existing >= 0) {
    // replace the score and the wording of the row for this benchmark, inside this record's results
    const close = text.indexOf('\n    ]', open);
    const rowAt = text.indexOf(`"benchmark": ${JSON.stringify(row.benchmark)},`, open);
    if (rowAt < 0 || rowAt > close) throw new Error(`result ${row.benchmark} not found in ${docId}`);
    const rowEnd = text.indexOf('\n      }', rowAt);
    let body = text.slice(rowAt, rowEnd);
    body = body.replace(/"score": [^,\n]+/, `"score": ${JSON.stringify(row.score)}`);
    body = body.replace(/"as_written": "(?:[^"\\]|\\.)*"/, `"as_written": ${JSON.stringify(row.as_written)}`);
    out = text.slice(0, rowAt) + body + text.slice(rowEnd);
  } else if (text.startsWith(']', open)) {
    out = `${text.slice(0, open)}\n${rowText(row)}\n    ${text.slice(open)}`;
  } else {
    const close = text.indexOf('\n    ]', open);
    out = `${text.slice(0, close)},\n${rowText(row)}${text.slice(close)}`;
  }
  // the edit must equal the same change made to the parsed data
  const want = structuredClone(docs);
  const doc = want.find((d) => d.id === docId)!;
  if (existing >= 0) doc.results[existing] = { ...doc.results[existing], score: row.score, as_written: row.as_written };
  else doc.results.push(row);
  if (JSON.stringify(JSON.parse(out)) !== JSON.stringify(want)) throw new Error(`the edit to ${docId} did not come out as expected`);
  return out;
}

// ---- the forms ------------------------------------------------------------------------------------

const AREA_CATEGORY: Record<string, string> = {
  'Knowledge and language': 'knowledge-qa',
  'Math and science': 'math',
  Coding: 'coding',
  'Agents and tools': 'tool-use',
  'Professional work': 'economic-work',
  'Vision, audio and robotics': 'multimodal-vision',
  'Safety and security': 'safety-alignment',
  Other: 'other',
};
const ACCESS: Record<string, string> = { Public: 'public', 'Held out': 'private', 'Partly held out': 'public+private-holdout' };

/** The critique form's boxes, by the text before the first period, and the audit problem each one means. */
export const PROBLEM_OF: Record<string, string> = {
  'Broken grader': 'broken-grader',
  'Leaked answers': 'leaked-answers',
  'Wrong labels': 'wrong-labels',
  Contamination: 'contamination',
  'Reward hacking': 'reward-hacking',
  'Input that does not matter': 'ignored-input',
  'Harness differences': 'harness-differences',
  'Unclear tasks': 'underspecified-tasks',
  'Trips content filters': 'content-filter',
};
export const STATUS_OF: Record<string, string> = {
  'Still open': 'open',
  'Fixed by the maker': 'fixed-by-maker',
  'Replaced by a new version': 'new-version',
  'Fixed in a copy': 'fixed-in-fork',
  Disputed: 'disputed',
};
const FIX_LABEL: Record<string, string> = { 'fixed-by-maker': "The maker's fix", 'new-version': 'The new version', 'fixed-in-fork': 'The fixed copy' };

const noPr = (kind: Kind | 'unknown', comment: string): Outcome => ({ kind, action: 'comment', changes: [], todo: [], files: {}, comment });

/** Inserts `item` before the first element it sorts ahead of, keeping a sorted list sorted. */
export function insertSorted<T>(list: T[], item: T, ahead: (a: T, b: T) => boolean): T[] {
  const i = list.findIndex((x) => ahead(item, x));
  return i < 0 ? [...list, item] : [...list.slice(0, i), item, ...list.slice(i)];
}
// benchmarks.json is sorted by lowercase name, audits newest first, reviewed.json's added list by id. Alphabetical
// order puts two pull requests' new lines in different places, so they don't conflict.
const byName = (a: Benchmark, b: Benchmark) => a.name.toLowerCase() < b.name.toLowerCase();
const newestFirst = (a: { date: string; id: string }, b: { date: string; id: string }) => a.date > b.date || (a.date === b.date && a.id > b.id);
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id;

function uniqueId(base: string, taken: Set<string>): string {
  const b = base.slice(0, 80).replace(/-+$/, '') || 'benchmark';
  if (!taken.has(b)) return b;
  for (let i = 2; ; i++) if (!taken.has(`${b}-${i}`)) return `${b}-${i}`;
}

function benchmarkForm(issue: Issue, f: Map<string, string>, data: Data, today: string): Outcome {
  const base = nameText(f.get('Name'), 120);
  if (!base) return noPr('benchmark', 'The bot could not read the name as plain text of 120 characters or fewer, so it opened no pull request. A maintainer will add this benchmark by hand.');
  const version = nameText(f.get('Version'), 30);
  const name = version && !base.toLowerCase().includes(version.toLowerCase()) ? `${base} ${version}` : base;
  const known = findBenchmark(name, data).record ?? findBenchmark(base, data).record;
  if (known && (!version || known.name.toLowerCase().includes(version.toLowerCase())))
    return noPr('benchmark', `The almanac already has this benchmark as ${shown(known.name)} (id ${shown(known.id)}), so the bot opened no pull request. To change that record, use **Correct a record** or **I make or maintain a benchmark**.`);

  const todo: string[] = [];
  const id = uniqueId(slug(name), new Set(data.benchmarks.map((b) => b.id)));
  const rec: Benchmark = { id, name };
  const area = plain(f.get('Area'), 60);
  rec.category = (area && AREA_CATEGORY[area]) || 'other';
  todo.push(`Check the category ${shown(rec.category)}, which the bot picked from the area ${shown(area ?? 'none')}. Add a subcategory, level, scoring method and format.`);
  const description = prose(f.get('What it tests'), 600);
  if (description) rec.description = description;
  else todo.push('Write a description. The form gave none the bot could use.');
  const org = nameText(f.get('Made by'), 160);
  if (org) rec.org = org;
  const released = month(f.get('Released'));
  if (released) rec.released = released;
  else if (f.get('Released')) todo.push(`Set the release month. The form says ${shown(f.get('Released'))}.`);
  if (version) rec.version = version;
  const recLinks: Record<string, string> = {};
  for (const [label, k] of [
    ['Paper or report', 'paper'],
    ['Code', 'repo'],
    ['Data', 'dataset'],
    ['Leaderboard', 'leaderboard'],
  ] as const) {
    const u = https(f.get(label));
    if (u) recLinks[k] = u;
    else if (f.get(label)) todo.push(`Check the ${label.toLowerCase()} link. The bot keeps https links only, and the form says ${shown(f.get(label))}.`);
  }
  if (Object.keys(recLinks).length) rec.links = recLinks;
  rec.access = ACCESS[plain(f.get('Test set'), 40) ?? ''] ?? 'unknown';
  const scoring = plain(f.get('Scoring'), 200);
  if (scoring && /%|percent|accuracy|pass@|resolve|success rate/i.test(scoring)) {
    rec.unit = '%';
    rec.better = 'higher';
  } else if (scoring && /\belo\b/i.test(scoring)) {
    rec.unit = 'elo';
    rec.better = 'higher';
  } else todo.push(`Set the unit and whether higher is better. The form says ${shown(scoring ?? 'nothing')} about scoring.`);
  rec.confidence = 'likely';
  const evidence = links(f.get('Evidence'));
  if (evidence.length) rec.evidence = evidence;
  rec.added = today;
  todo.push('Raise confidence to "verified" once the links check out.');
  const scores = https(f.get('Scores file'));
  if (scores) todo.push(`The makers point to a scores file: ${shown(scores)}. Add an importer in scripts/leaderboards/ if its terms allow.`);
  const license = plain(f.get('License'), 120);
  if (license) todo.push(`The form gives the license ${shown(license)}.`);

  const benchmarks = insertSorted(data.benchmarks, rec, byName);
  const changes = [`data/benchmarks.json: new record ${shown(id)}, ${shown(name)}.`];
  // a new version of a cataloged benchmark joins its family when the old one has one
  const replaces = plain(f.get('Replaces'), 300);
  if (replaces) {
    const old = findBenchmark(replaces.split(/[,.(]/)[0], data).record;
    if (old && old.family && version && released) {
      rec.family = old.family;
      if (!old.successor) {
        const i = benchmarks.findIndex((b) => b.id === old.id);
        benchmarks[i] = { ...old, successor: id };
        changes.push(`data/benchmarks.json: ${shown(old.id)} now names ${shown(id)} as its successor.`);
      }
      changes.push(`data/benchmarks.json: ${shown(id)} joins the family ${shown(old.family)}.`);
    } else todo.push(`The form says it replaces ${shown(replaces)}. Set the family and the successor by hand.`);
  }
  for (const k of Object.keys(rec)) if (k !== 'id' && k !== 'name' && k !== 'added') changes.push(`  ${k}: ${shown(rec[k])}`);
  const reviewed: Reviewed = { ...data.reviewed, added: insertSorted(data.reviewed.added, { id, date: today, via: `Submitted through the benchmark form, issue #${issue.number}.` }, byId) };
  changes.push(`data/reviewed.json: ${shown(id)} listed as added on ${today}.`);
  return {
    kind: 'benchmark',
    action: 'pr',
    title: `Add benchmark: ${name}`,
    changes,
    todo,
    files: { 'data/benchmarks.json': json(benchmarks), 'data/reviewed.json': json(reviewed) },
  };
}

function critiqueForm(issue: Issue, f: Map<string, string>, data: Data, today: string): Outcome {
  const m = findBenchmark(f.get('Benchmark') ?? '', data);
  if (!m.record) {
    const which = m.candidates.length ? ` It matches more than one record: ${m.candidates.map((c) => shown(c.id)).join(', ')}.` : '';
    return noPr('critique', `The bot could not tell which benchmark this is about, so it opened no pull request.${which} Edit the **Benchmark** field to the benchmark's name or its almanac page link, then remove and add the label again.`);
  }
  const problems = ticked(f.get('Kind of problem'))
    .map((t) => PROBLEM_OF[t.split('.')[0].trim()])
    .filter((p): p is string => !!p);
  if (!problems.length) return noPr('critique', 'No ticked box names a problem kind the almanac tracks, so the bot opened no pull request. A maintainer will pick one by hand.');
  const summary = prose(f.get('What the problem is'), 800);
  if (!summary) return noPr('critique', 'The bot could not read **What the problem is** as two or three sentences, so it opened no pull request.');
  const sourceText = f.get('Sources') ?? '';
  const url = https(sourceText);
  if (!url) return noPr('critique', 'The **Sources** field has no https link, so the bot opened no pull request. Add the link to the audit, paper or issue, then remove and add the label again.');

  const todo: string[] = [];
  const statusText = plain(f.get('Status'), 60) ?? '';
  const status = STATUS_OF[statusText] ?? 'open';
  if (!STATUS_OF[statusText]) todo.push(`The form doesn't say whether it's fixed (${shown(statusText || 'no answer')}), so the status is "open". Check it.`);
  const finding: Finding = { benchmark: m.record.id, problems, summary, status };
  const numbers = prose(f.get('Numbers'), 600);
  if (numbers) finding.numbers = numbers;
  const fix = https(f.get('Fix'));
  if (fix) finding.fixes = [{ label: FIX_LABEL[status] ?? 'The fix', url: fix }];

  let audits = structuredClone(data.audits);
  const same = audits.find((a) => sameLink(a.url, url));
  const changes: string[] = [];
  if (same) {
    if (same.findings.some((x) => x.benchmark === m.record!.id))
      return noPr('critique', `The almanac already lists this source (${shown(same.title)}) for ${shown(m.record.name)}, so the bot opened no pull request.`);
    same.findings.push(finding);
    changes.push(`data/audits.json: a finding on ${shown(m.record.id)} added to the audit ${shown(same.id)}.`);
  } else {
    // "https://example.org/audit (Example Lab, 2026-11-03)"
    const cite = sourceText.match(/\(([^,()]{2,80}),\s*(\d{4}-\d{2}-\d{2})\)/);
    const host = new URL(url).hostname.replace(/^www\./, '');
    const owner = host === 'github.com' ? new URL(url).pathname.split('/')[1] || undefined : undefined;
    const author = plain(cite?.[1], 80) ?? owner ?? host;
    const date = cite?.[2] ?? today;
    const fromTitle = plain(issue.title.replace(/^Critique:\s*/i, ''), 160);
    const title = fromTitle && fromTitle.length > 3 ? fromTitle : `${m.record.name} critique`;
    const paper = /(^|\.)(arxiv\.org|openreview\.net|aclanthology\.org|doi\.org)$/.test(host);
    const id = uniqueId(`${slug(author)}-${date}`, new Set(audits.map((a) => a.id)));
    audits = insertSorted(audits, { id, title, author, date, url, source: paper ? 'paper' : 'write-up', findings: [finding] }, newestFirst);
    changes.push(`data/audits.json: new audit ${shown(id)}, ${shown(title)} by ${shown(author)}, ${date}, with a finding on ${shown(m.record.id)}.`);
    todo.push("Check the audit's title, author and date against the source. The bot took them from the issue title and the Sources line.");
  }
  changes.push(`  problems: ${shown(problems.join(', '))}`, `  status: ${shown(status)}`, `  summary: ${shown(summary)}`);
  if (finding.numbers) changes.push(`  numbers: ${shown(finding.numbers)}`);
  if (fix) changes.push(`  fix: ${shown(fix)}`);
  todo.push('Rewrite the summary in the house style if needed: who found what, and how many tasks it affects.');
  return { kind: 'critique', action: 'pr', title: `Log critique of ${m.record.name}`, changes, todo, files: { 'data/audits.json': json(audits) } };
}

/** Fields a "field: value" line can set, by record kind, and how each value is checked. */
const SETTABLE: Record<'benchmarks' | 'models' | 'labs', Record<string, (v: string) => string | undefined>> = {
  benchmarks: {
    name: (v) => nameText(v, 120),
    org: (v) => nameText(v, 160),
    'made by': (v) => nameText(v, 160),
    released: month,
    version: (v) => nameText(v, 30),
    description: (v) => prose(v, 600),
    paper: https,
    repo: https,
    code: https,
    dataset: https,
    data: https,
    leaderboard: https,
    site: https,
  },
  models: { name: (v) => nameText(v, 120), released: (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : month(v)) },
  labs: { name: (v) => nameText(v, 120) },
};
const FIELD_NAME: Record<string, string> = { 'made by': 'org', code: 'repo', data: 'dataset' };
const LINK_KINDS = new Set(['paper', 'repo', 'dataset', 'leaderboard', 'site']);

/** "field: value" lines that name a field the bot may set, with their checked values. */
export function fieldLines(text: string | undefined, kind: keyof typeof SETTABLE): { set: [string, string][]; skipped: string[] } {
  const set: [string, string][] = [];
  const skipped: string[] = [];
  for (const line of (text ?? '').split('\n')) {
    const m = line.match(/^\s*(?:[-*]\s*)?`?([A-Za-z][A-Za-z ]{1,20}?)`?\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const name = m[1].trim().toLowerCase();
    const check = SETTABLE[kind][name];
    if (!check) continue;
    const v = check(m[2].replace(/^`|`$/g, ''));
    if (v === undefined) skipped.push(`${name}: ${m[2]}`);
    else set.push([FIELD_NAME[name] ?? name, v]);
  }
  return { set, skipped };
}

function applyFields<T extends Obj>(rec: T, set: [string, string][]): { rec: T; changes: string[] } {
  const out: Obj = structuredClone(rec);
  const changes: string[] = [];
  for (const [field, value] of set) {
    if (LINK_KINDS.has(field)) {
      const links = { ...((out.links as Record<string, string> | null) ?? {}) };
      if (links[field] === value) continue;
      changes.push(`  links.${field}: ${shown(links[field] ?? 'none')} to ${shown(value)}`);
      links[field] = value;
      out.links = links;
    } else {
      if (out[field] === value) continue;
      changes.push(`  ${field}: ${shown(out[field] ?? 'none')} to ${shown(value)}`);
      out[field] = value;
    }
  }
  return { rec: out as T, changes };
}

function maintainerForm(issue: Issue, f: Map<string, string>, data: Data): Outcome {
  const m = findBenchmark(f.get('Benchmark') ?? '', data);
  if (!m.record) {
    const which = m.candidates.length ? ` It matches more than one record: ${m.candidates.map((c) => shown(c.id)).join(', ')}.` : '';
    return noPr('maintainer', `The bot could not tell which benchmark this is about, so it opened no pull request.${which} Edit the **Benchmark** field to its name or its almanac page link, then remove and add the label again.`);
  }
  const todo: string[] = [];
  const feed = https(f.get('Results file or API'));
  if (feed) todo.push(`Write an importer in scripts/leaderboards/${m.record.id}.ts for the results feed ${shown(feed)}, with the terms ${shown(plain(f.get('Terms for reading it'), 160) ?? 'not given')}.`);
  for (const want of ticked(f.get("What you'd like")))
    if (/retired|successor|headline/i.test(want)) todo.push(`The maintainers ask: ${shown(want)}. Make that change by hand.`);
  const { set, skipped } = fieldLines(f.get('Text changes'), 'benchmarks');
  for (const s of skipped) todo.push(`The bot skipped the line ${shown(s)}, because its value didn't pass the checks.`);
  const { rec, changes } = applyFields(m.record, set);
  if (!changes.length) {
    const next = todo.length ? `\n\nWhat a maintainer will do:\n${todo.map((t) => `- ${t}`).join('\n')}` : '';
    return noPr('maintainer', `The form has no \`field: value\` line the bot can apply, so it opened no pull request. A maintainer will make the changes by hand.${next}`);
  }
  const benchmarks = data.benchmarks.map((b) => (b.id === rec.id ? rec : b));
  if (f.get('Text changes') && f.get('Text changes')!.split('\n').length > set.length) todo.push('Read the rest of **Text changes** in the issue. The bot applied only its `field: value` lines.');
  return {
    kind: 'maintainer',
    action: 'pr',
    title: `Update ${m.record.name} from its maintainers`,
    changes: [`data/benchmarks.json: ${shown(rec.id)}`, ...changes],
    todo,
    files: { 'data/benchmarks.json': json(benchmarks) },
  };
}

/** The first number in "74.3%" or "74.3 (±1.1)", with its unit when the text gives one. */
export function scoreOf(text: string | undefined): { score: number; percent: boolean } | undefined {
  const m = (text ?? '').match(/(-?\d{1,6}(?:[.,]\d+)?)\s*(%|percent)?/);
  if (!m) return undefined;
  const score = Number(m[1].replace(',', '.'));
  return Number.isFinite(score) ? { score, percent: !!m[2] } : undefined;
}

function scoreForm(issue: Issue, f: Map<string, string>, data: Data): Outcome {
  const where = plain(f.get('Where it was published'), 80) ?? '';
  const doc = where.startsWith("The lab's launch post") ? 'cards' : where.startsWith('A system card') ? 'systemCards' : undefined;
  if (!doc)
    return noPr('score', `Scores from ${shown(where || 'this source')} don't go in by hand. Leaderboard scores come from the importers in scripts/leaderboards/, so a missing row usually means an importer needs a fix. A maintainer will look at it.`);
  const b = findBenchmark(f.get('Benchmark') ?? '', data);
  const mo = findModel(f.get('Model') ?? '', data);
  if (!b.record || !mo.record) {
    const what = !b.record ? `benchmark ${shown(f.get('Benchmark') ?? '')}` : `model ${shown(f.get('Model') ?? '')}`;
    return noPr('score', `The bot could not match the ${what} to one record, so it opened no pull request. Use the name the almanac uses, or link its page, then remove and add the label again.`);
  }
  const source = https(f.get('Source'));
  if (!source) return noPr('score', 'The **Source** field has no https link, so the bot opened no pull request.');
  const parsed = scoreOf(f.get('Score'));
  if (!parsed) return noPr('score', `The bot could not read a number from ${shown(f.get('Score') ?? '')}, so it opened no pull request.`);

  const docs = doc === 'cards' ? data.cards : data.systemCards;
  const mine = docs.filter((d) => d.model === mo.record!.id);
  const byLink = mine.filter((d) => sameLink(d.url, source));
  const target = byLink.length === 1 ? byLink[0] : undefined;
  if (!target) {
    const list = mine.length ? ` The almanac has these for ${shown(mo.record.name)}: ${mine.map((d) => `${shown(d.id)} (${d.url})`).join(', ')}.` : ` The almanac has none for ${shown(mo.record.name)} yet.`;
    return noPr('score', `The source link doesn't match exactly one ${doc === 'cards' ? 'launch post' : 'system card'} in the almanac, so the bot opened no pull request.${list} A maintainer will add it by hand.`);
  }
  const unit = parsed.percent ? '%' : String(b.record.unit ?? '%');
  const setting = plain(f.get('Setting'), 200);
  const row: Result = { benchmark: b.record.id, score: parsed.score, unit, as_written: [plain(f.get('Benchmark'), 120), setting].filter(Boolean).join(', ') };
  const todo: string[] = [];
  if (doc === 'systemCards') {
    row.section = 'capabilities';
    todo.push('Check the section. The bot set "capabilities".');
  }
  const old = target.results.find((r) => r.benchmark === b.record!.id);
  if (old && old.score === row.score) return noPr('score', `The almanac already records ${row.score} for ${shown(b.record.name)} in ${shown(target.id)}, so the bot opened no pull request.`);
  const path = doc === 'cards' ? 'data/cards.json' : 'data/system-cards.json';
  const text = spliceResult(doc === 'cards' ? data.cardsText : data.systemCardsText, docs, target.id, row);
  const changes = [
    old
      ? `${path}: ${shown(target.id)}, ${shown(b.record.id)} score ${shown(old.score)} to ${shown(row.score)}, as written ${shown(row.as_written)}.`
      : `${path}: ${shown(target.id)} gets ${shown(b.record.id)} ${shown(row.score)} ${shown(unit)}, as written ${shown(row.as_written)}.`,
  ];
  todo.push(`Check the number against the source, ${source}.`);
  return { kind: 'score', action: 'pr', title: `${old ? 'Fix' : 'Add'} ${mo.record.name} score on ${b.record.name}`, changes, todo, files: { [path]: text } };
}

function correctionForm(issue: Issue, f: Map<string, string>, data: Data): Outcome {
  const page = (f.get('Page') ?? '').match(/\/(benchmarks|models|labs)\/([a-z0-9][a-z0-9-]*)\/?/);
  const manual = (why: string) => noPr('correction', `${why} A maintainer will make the correction by hand.`);
  if (!page) return manual('The **Page** field is not a benchmark, model or lab page of the almanac, so the bot opened no pull request.');
  const kind = page[1] as 'benchmarks' | 'models' | 'labs';
  const list = (kind === 'benchmarks' ? data.benchmarks : kind === 'models' ? data.models : data.labs) as Obj[];
  const rec = list.find((x) => x.id === page[2]);
  if (!rec) return manual(`The almanac has no ${kind.slice(0, -1)} with the id ${shown(page[2])}, so the bot opened no pull request.`);
  const source = https(f.get('Source'));
  if (!source) return manual('The **Source** field has no https link, so the bot opened no pull request.');
  const { set, skipped } = fieldLines(f.get('What is wrong'), kind);
  if (!set.length) return manual('The bot found no `field: value` line it can apply in **What is wrong**, so it opened no pull request.');
  const { rec: next, changes } = applyFields(rec, set);
  if (!changes.length) return manual('The values in the issue match what the almanac already has, so the bot opened no pull request.');
  const files: Record<string, string> = { [`data/${kind}.json`]: json(list.map((x) => (x.id === next.id ? next : x))) };
  const todo = [`Check each value against the source, ${source}.`, ...skipped.map((s) => `The bot skipped the line ${shown(s)}, because its value didn't pass the checks.`)];
  return {
    kind: 'correction',
    action: 'pr',
    draft: true,
    title: `Correct ${String(rec.name)}`,
    changes: [`data/${kind}.json: ${shown(next.id)}`, ...changes],
    todo,
    files,
  };
}

/** Decides what an accepted issue becomes. `today` is YYYY-MM-DD. */
export function accept(issue: Issue, data: Data, today: string): Outcome {
  const kind = formOf(issue.labels, issue.title);
  if (!kind) return noPr('unknown', 'This issue did not come from one of the forms, so the bot opened no pull request. A maintainer will handle it by hand.');
  if (kind === 'bug' || kind === 'idea')
    return noPr(kind, `${kind === 'bug' ? 'Bug reports' : 'Ideas'} change the site's code, not its data, so the bot opens no pull request for them. A maintainer will follow up here.`);
  const f = parseForm(issue.body);
  if (kind === 'benchmark') return benchmarkForm(issue, f, data, today);
  if (kind === 'critique') return critiqueForm(issue, f, data, today);
  if (kind === 'maintainer') return maintainerForm(issue, f, data);
  if (kind === 'score') return scoreForm(issue, f, data);
  return correctionForm(issue, f, data);
}

/** The pull request body: what changed, the checks, and what a maintainer still has to do. */
export function prBody(issue: Issue, o: Outcome, check: string): string {
  return [
    `Closes #${issue.number}`,
    '',
    `The accept bot made this change from the ${o.kind} form in #${issue.number}, after a maintainer added the "accepted" label. Values from the issue are shown in code spans.`,
    '',
    '## What changed',
    '',
    ...o.changes.map((c) => (c.startsWith('  ') ? `  - ${c.trim()}` : `- ${c}`)),
    '',
    '## Checks',
    '',
    '```',
    check.trim().slice(0, 1500),
    '```',
    '',
    ...(o.todo.length ? ['## Before merging', '', ...o.todo.map((t) => `- [ ] ${t}`), ''] : []),
  ].join('\n');
}
