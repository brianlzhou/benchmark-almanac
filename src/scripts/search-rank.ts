// How search ranks rows: no page or browser code here, so the same ranking runs in a test script.
//
// A name match ranks first, then other spellings, then the words a row can also be found by (a benchmark's
// maker or description, a model's lab). When no name matches, a second pass allows one typo per word
// ("swe bench verifed"), and those rows rank above the weaker word matches. Rows that match equally well rank
// by weight: for benchmarks, the launch posts that cite them (shown on each row), so "aime" lists the
// most-cited AIME first. Weight never lifts a row above a better kind of match.

export type Kind = 'b' | 'm' | 'l' | 'c' | 'p';
/** [name, url, kind, detail, other spellings, weight, more words]. See src/lib/search-index.ts. */
export type Row = [string, string, Kind, string, string, number, string];
/** A name or other-spelling match scores this or more. Below it, the match is only on other words. */
export const STRONG = 36;
/** Words too common in queries to say anything about which benchmark is meant. */
export const QUERY_STOP = new Set(
  'the and for with from that this into what when where which who are was can how does find want looking show benchmark benchmarks eval evals evaluation evaluations test tests model models evaluate evaluates evaluating measure measures like about any some'.split(
    ' ',
  ),
);

export interface Entry {
  r: Row;
  name: string;
  compact: string;
  alts: string[];
  /** name and other spellings, with a leading space so a word start is " word" */
  names: string;
  /** everything the row can be found by */
  all: string;
  /** the same without spaces: one cheap check rules most rows out before they are scored */
  flat: string;
}
export interface Hit {
  r: Row;
  s: number;
}
/** The rows the last query of three or more letters could match, and that query's words. One per search box. */
export interface Memo {
  kept: Entry[] | null;
  keptFor: string[];
}

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function toEntry(r: Row): Entry {
  const name = norm(r[0]);
  const alts = r[4] ? r[4].split(' | ').map(norm).filter(Boolean) : [];
  const names = ` ${[name, ...alts].join(' ')}`;
  const all = `${names} ${norm(r[3])} ${r[6]} `;
  return { r, name, compact: name.replace(/ /g, ''), alts, names, all, flat: all.replace(/ /g, '') };
}

/** Add a row's description words, which load after the names. */
export function addWords(e: Entry, words: string) {
  e.all += `${words} `;
  e.flat += words.replace(/ /g, '');
}

// the query in every form the checks need, made once per keystroke rather than once per row
interface Query {
  q: string;
  /** " q": the query at a word start */
  sq: string;
  /** the query without spaces */
  cq: string;
  toks: string[];
  /** each word with a leading space */
  stoks: string[];
  /** the words that say what is meant: no "a", "where" or "benchmark", so a sentence can still match */
  ctoks: string[];
  sctoks: string[];
}

function score(e: Entry, x: Query, short: boolean): number {
  const { name, alts } = e;
  const { q, stoks } = x;
  if (name === q) return 100;
  if (alts.includes(q)) return 92;
  if (name.startsWith(q)) return 80;
  if (name.includes(x.sq)) return 66;
  if (alts.some((a) => a.startsWith(q))) return 62;
  if (name.includes(q)) return 52;
  if (x.cq.length >= 3 && e.compact.includes(x.cq)) return 48;
  if (alts.some((a) => a.includes(q))) return 42;
  if (stoks.every((t) => e.names.includes(t))) return STRONG;
  // one or two letters say nothing about a description
  if (short) return -1;
  if (x.sctoks.every((t) => e.all.includes(t))) return 22;
  if (x.ctoks.every((t) => t.length >= 3 && e.all.includes(t))) return 10;
  return -1;
}

/** The best 20 rows for a normalized query, best first. */
export function rank(entries: Entry[], q: string, memo: Memo): Hit[] {
  if (!q) return [];
  const toks = q.split(' ');
  const content = toks.filter((t) => t.length >= 3 && !QUERY_STOP.has(t));
  const ctoks = content.length ? content : toks;
  const x: Query = { q, sq: ` ${q}`, cq: q.replace(/ /g, ''), toks, stoks: toks.map((t) => ` ${t}`), ctoks, sctoks: ctoks.map((t) => ` ${t}`) };
  // Every kind of match needs each meaningful word somewhere in the row's text, so one cheap check rules
  // out most rows. A one- or two-letter query only looks at names. When every word the last query needed
  // is part of a word this one needs (the usual case while typing), only the rows it kept can match.
  const short = q.length < 3;
  let pool: Entry[];
  if (short) pool = entries.filter((e) => toks.every((t) => e.names.includes(t)));
  else {
    const narrower = memo.kept && memo.keptFor.every((t) => ctoks.some((c) => c.includes(t)));
    pool = (narrower ? memo.kept! : entries).filter((e) => ctoks.every((t) => e.flat.includes(t)));
    memo.kept = pool;
    memo.keptFor = ctoks;
  }
  const top = new Top();
  for (const e of pool) {
    const s = score(e, x, short);
    if (s >= 0) top.add(e, s);
  }
  // nothing matched a name: try again allowing one typo per word. A row found both ways keeps the typo score.
  if (!short && x.cq.length >= 4 && !top.rows.some((t) => t.s >= STRONG)) {
    const found = typos(entries, toks);
    const seen = new Set(found.map(([e]) => e.r));
    top.rows = top.rows.filter((t) => !seen.has(t.r));
    for (const [e, s] of found) top.add(e, s);
  }
  return top.rows;
}

/** The best 20, best first, kept in place: a one-letter query matches thousands of rows, so no full sort. */
class Top {
  rows: (Hit & { k: number })[] = [];
  add(e: Entry, s: number) {
    const top = this.rows;
    // the kind of match decides first. Within one kind: the higher weight, then the shorter name
    const k = s * 1e9 + (e.r[5] ?? 0) - e.name.length / 1000;
    if (top.length === 20 && k <= top[19].k) return;
    let i = top.length;
    while (i > 0 && top[i - 1].k < k) i--;
    top.splice(i, 0, { r: e.r, s, k });
    if (top.length > 20) top.pop();
  }
}

// ---- one typo per word ----

/** True when a and b differ by at most one inserted, deleted or changed letter, or two neighbors swapped. */
export function oneEdit(a: string, b: string): boolean {
  const la = a.length;
  const lb = b.length;
  if (la - lb > 1 || lb - la > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  // after the one change, the rest must be the same
  const same = (p: number, q: number) => {
    if (la - p !== lb - q) return false;
    while (p < la) if (a[p++] !== b[q++]) return false;
    return true;
  };
  if (la === lb) return i === la || same(i + 1, i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && same(i + 2, i + 2));
  return la > lb ? same(i + 1, i) : same(i, i + 1);
}

/** A query word of four or more letters may have one typo or be the start of a word. A shorter one must start a word. */
const near = (t: string, w: string) => w.startsWith(t) || (t.length >= 4 && oneEdit(t, w));

// every distinct word in the names and other spellings, with the rows that use it (about 4,700 words)
const vocabs = new WeakMap<Entry[], Map<string, number[]>>();
function vocab(entries: Entry[]) {
  let v = vocabs.get(entries);
  if (v) return v;
  v = new Map();
  entries.forEach((e, i) => {
    for (const w of new Set(e.names.split(' '))) {
      if (!w) continue;
      const rows = v!.get(w);
      if (rows) rows.push(i);
      else v!.set(w, [i]);
    }
  });
  vocabs.set(entries, v);
  return v;
}

/** Rows whose names hold every query word, allowing one typo in each word of four or more letters. */
export function typos(entries: Entry[], toks: string[]): [Entry, number][] {
  const content = toks.filter((t) => !QUERY_STOP.has(t));
  const words = content.length ? content : toks;
  // with no long word, this pass would find only what the first one already did. No name has 12 words.
  if (!words.some((t) => t.length >= 4) || words.length > 12) return [];
  const v = vocab(entries);
  // how many query words, in order, each row has matched so far
  const got = new Uint8Array(entries.length);
  words.forEach((t, k) => {
    for (const [w, rows] of v) if (near(t, w)) for (const i of rows) if (got[i] === k) got[i] = k + 1;
  });
  const out: [Entry, number][] = [];
  for (let i = 0; i < entries.length; i++) {
    if (got[i] !== words.length) continue;
    const e = entries[i];
    // the query reads as the start of the name, word for word: ranks like a name that starts with it
    const lined = [e.name, ...e.alts].some((n) => {
      const ws = n.split(' ');
      return toks.length <= ws.length && toks.every((t, j) => near(t, ws[j]));
    });
    out.push([e, lined ? 78 : STRONG + 2]);
  }
  return out;
}
