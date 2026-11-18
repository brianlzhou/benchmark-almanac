// The field watch: what each board's feed publishes beyond what its importer keeps. The sync hands every body a board
// fetches to observe(), which notes the record fields it sees (JSON keys, CSV columns, table headers). After the board's
// rows are built, review() names the fields of a kind the rows don't store (a cost, a run date, a verified mark) and the
// fields the board didn't publish last time. The sync writes them to data/scores/field-review.json, so a person can go
// through them, wire them into the importer, or mark them reviewed in data/field-decisions.json.
import type { LeaderboardRow } from '../leaderboards/types.ts';

/** The kinds of fact a field can hold, from the dropped-fields audit of 2026-11-15. The first that matches wins. */
export const KINDS: [string, RegExp][] = [
  ['cost', /\b(cost|price|usd|spend|dollars?)\b/],
  ['tokens', /\b(tokens?)\b/],
  ['uncertainty', /\b(ci|ci95|std|stdev|stderr|se|sem|confidence|interval|lower|upper|margin|moe|variance|bootstrap)\b/],
  ['trials', /\b(attempts?|trials?|runs|seeds?|samples|repeats?|n runs|num runs)\b/],
  ['time, latency or steps', /\b(latency|time|duration|runtime|seconds|secs|steps?|turns?|ttft|throughput|minutes)\b/],
  ['verified', /\b(verified|official|reproduced|validated|certified)\b/],
  ['submitter or agent maker', /\b(submitter|submitted by|organi[sz]ation|org|team|author|affiliation|developer|institution)\b/],
  ['harness or agent', /\b(agent|harness|scaffold|framework)\b/],
  // "open" alone only as the whole field ("open", "is_open"), so a header such as "Muse Spark Open" doesn't match
  ['open weights, license or size', /\b(license|weights|open source|params?|parameters|model size)\b|^(is )?open$/],
  ['run date', /\b(date|submitted|submission date|created|updated|timestamp|evaluated)\b/],
  ['link', /\b(url|link|trajector(y|ies)|logs?|traces?|transcripts?|submission|details|report|artifacts?)\b/],
  ['setting or effort', /\b(effort|reasoning|thinking|mode|temperature|setting|config|shots?|budget)\b/],
];

const words = (f: string) =>
  f
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[\s_./()[\]:-]+/)
    .join(' ')
    .trim();
export const kindOf = (field: string) => KINDS.find(([, re]) => re.test(words(field)))?.[0];

export interface Seen {
  /** Records that had it, of the records in the same set. */
  n: number;
  total: number;
  sample: string;
}

let current: Map<string, Seen> | null = null;

/** Start noting what one board's feed holds. */
export function begin() {
  current = new Map();
}

const note = (field: string, have: boolean, sample: unknown, total: number) => {
  if (!current || !field || field.length > 60) return;
  const s = current.get(field) ?? { n: 0, total: 0, sample: '' };
  s.total = Math.max(s.total, total);
  if (have) {
    s.n++;
    if (!s.sample) s.sample = String(typeof sample === 'object' ? JSON.stringify(sample) : sample).slice(0, 60);
  }
  current.set(field, s);
};

/** The record sets in a parsed JSON body: arrays of three or more objects, found up to five levels down. */
function records(v: unknown, depth = 0, out: Record<string, unknown>[][] = []) {
  if (depth > 5 || v === null || typeof v !== 'object') return out;
  if (Array.isArray(v)) {
    const objs = v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x));
    if (objs.length >= 3 && objs.length >= v.length / 2) out.push(objs);
    for (const x of v.slice(0, 50)) records(x, depth + 1, out);
  } else for (const x of Object.values(v)) records(x, depth + 1, out);
  return out;
}

const empty = (x: unknown) => x === null || x === undefined || x === '' || (Array.isArray(x) && !x.length);

/** Note the fields of one fetched body: JSON records, a CSV header, or HTML and Markdown table headers. */
export function observe(_url: string, body: string) {
  if (!current || typeof body !== 'string' || body.length > 50_000_000) return;
  const t = body.trimStart();
  if (t.startsWith('{') || t.startsWith('[')) {
    try {
      for (const set of records(JSON.parse(t))) {
        const keys = new Set(set.flatMap((r) => Object.keys(r)));
        for (const k of keys)
          for (const r of set) {
            const v = r[k];
            // one level into an object field: "cost.total", "metadata.date"
            if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k2, v2] of Object.entries(v)) note(`${k}.${k2}`, !empty(v2), v2, set.length);
            else note(k, !empty(v), v, set.length);
          }
      }
      return;
    } catch {
      // not JSON after all
    }
  }
  const lines = t.split('\n', 4);
  if (lines.length >= 3 && /,/.test(lines[0]) && !/[<{]/.test(lines[0]) && lines[0].split(',').length === lines[1].split(',').length) {
    for (const h of lines[0].split(',')) note(h.replace(/^"|"$/g, '').trim(), true, '', 0);
    return;
  }
  // table headers in HTML and Markdown: present on every row by construction, so they count as full columns
  for (const m of t.matchAll(/<th[^>]*>([\s\S]{0,200}?)<\/th>/gi)) note(m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), true, '', 0);
  for (const m of t.matchAll(/^\|(.+)\|\s*\n\|\s*:?-{3,}/gm)) for (const h of m[1].split('|')) note(h.trim(), true, '', 0);
}

/** The kinds a board's rows store, from the fields the importer filled. */
export function storedKinds(rows: LeaderboardRow[]): Set<string> {
  const out = new Set<string>(['setting or effort']);
  const any = (f: (r: LeaderboardRow) => unknown) => rows.some((r) => !empty(f(r)));
  const metric = (re: RegExp) => rows.some((r) => Object.keys(r.metrics ?? {}).some((k) => re.test(words(k))));
  if (any((r) => r.cost) || metric(/\b(cost|price)\b/)) out.add('cost');
  if (any((r) => r.tokens) || metric(/\btokens?\b/)) out.add('tokens');
  if (any((r) => r.low) || metric(/\b(ci|std|stderr|se|sem|low|high|lower|upper|margin|moe)\b/)) out.add('uncertainty');
  if (any((r) => r.trials) || metric(/\b(pass|runs|trials|samples)\b/)) out.add('trials');
  if (metric(/\b(latency|time|duration|runtime|seconds|steps?|turns?|minutes|hours)\b/)) out.add('time, latency or steps');
  if (any((r) => r.verified)) out.add('verified');
  if (any((r) => r.submitter) || any((r) => r.agentOrg)) out.add('submitter or agent maker');
  if (any((r) => r.harness)) out.add('harness or agent');
  if (any((r) => r.open) || any((r) => r.license) || any((r) => r.params)) out.add('open weights, license or size');
  if (any((r) => r.date)) out.add('run date');
  if (any((r) => r.link)) out.add('link');
  return out;
}

export interface Flag {
  field: string;
  kind: string;
  /** "not stored": the feed has it on most entries and the rows keep nothing of its kind. "new": first seen today. */
  why: 'not stored' | 'new';
  share?: number;
  sample?: string;
}

/**
 * What to flag for one board: fields of a kind the rows don't store, present on at least half the records, and
 * fields the board didn't publish at the last sync. `known` is last sync's list, `decided` the fields a person
 * already reviewed.
 */
export function review(rows: LeaderboardRow[], known: string[] | undefined, decided: Set<string>): { fields: string[]; flags: Flag[] } {
  const seen = current ?? new Map<string, Seen>();
  current = null;
  const stored = storedKinds(rows);
  const flags: Flag[] = [];
  for (const [field, s] of seen) {
    if (decided.has(field)) continue;
    const kind = kindOf(field);
    const share = s.total ? s.n / s.total : 1;
    if (kind && !stored.has(kind) && share >= 0.5) flags.push({ field, kind, why: 'not stored', share: Math.round(share * 100) / 100, ...(s.sample ? { sample: s.sample } : {}) });
    else if (known && !known.includes(field) && kind) flags.push({ field, kind, why: 'new', ...(s.sample ? { sample: s.sample } : {}) });
  }
  return { fields: [...seen.keys()].sort(), flags: flags.sort((a, b) => a.kind.localeCompare(b.kind) || a.field.localeCompare(b.field)) };
}
