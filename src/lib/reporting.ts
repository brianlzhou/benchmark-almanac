// The data behind the Reporting page: which benchmarks labs name for their releases. A release is a launch post
// (data/cards.json). The system cards, model cards and technical reports published with it (data/system-cards.json,
// linked by `release`) add to the same release, so a benchmark counts once per release however many documents or
// settings report it. reporting-view.ts and reporting-graphics.ts draw the year views from this, and bump() and
// spread() below feed the two charts that cover every year.

import { cards, systemCards, labById, modelById, benchmarks, benchById, labPages, normUnit, AS_OF } from './data.ts';
import { featuredIds } from './routes.ts';
import { makerParts } from './makers.ts';
import { COLOR_MARKS, MONO_MARKS } from './marks.ts';
import { score as fmtScore } from './format.ts';
import { AREAS, areaOf } from './taxonomy.ts';
import type { Benchmark } from './types.ts';
import { FRONTIER, FRONTIER_LABS, type RData, type RLab, type RBench, type RRel } from './reporting-view.ts';

export const FIRST_YEAR = '2024';
/** Categories a capability count leaves out by default: they are mostly safety testing in system cards. */
export const SAFETY_CATEGORIES = new Set(['safety-alignment', 'bio-chem', 'cyber']);

const SHORT: Record<string, string> = { google: 'Google', 'thinking-machines': 'Thinking Machines' };
const shortName = (id: string, name: string) =>
  SHORT[id] ?? name.replace(/\s+(AI|Corp|Corporation|Seed|University|Lab|Labs|Research|Inc\.?)$/i, '').replace(/^The\s+/, '');

/** A family's name without its version: "Terminal-Bench" for Terminal-Bench 1.0 to 4.0, "AIME" for AIME 2023 to 2026. */
function familyNames(): Map<string, string> {
  const members = new Map<string, Benchmark[]>();
  for (const b of benchmarks) if (b.family) members.set(b.family, [...(members.get(b.family) ?? []), b]);
  const out = new Map<string, string>();
  for (const [fam, bs] of members) {
    const names = bs.map((b) => b.name);
    let p = names.reduce((a, n) => {
      let i = 0;
      while (i < a.length && i < n.length && a[i] === n[i]) i++;
      return a.slice(0, i);
    });
    // a half-written version goes once ("AIME 202" to "AIME", "AMC 10 202" to "AMC 10"), then any separators
    p = p.replace(/\d+$/, '');
    for (let prev = ''; prev !== p; ) {
      prev = p;
      p = p.replace(/\s+v$/i, '').replace(/[\s\-–:(,.]+$/, '');
    }
    // the shared part has to end at a word boundary in every name ("OSWorld" in "OSWorld-Verified" does)
    const clean = p.length >= 3 && names.every((n) => n.length === p.length || !/[A-Za-z0-9]/.test(n[p.length]));
    const own = bs.find((b) => b.id === fam);
    const oldest = [...bs].sort((a, b) => (a.released ?? '9').localeCompare(b.released ?? '9'))[0];
    out.set(fam, clean ? p : (own ?? oldest).name);
  }
  return out;
}

/** Launch posts and linked documents counted in a year, and how many documents had no launch post to join. */
export function sourceCounts(year: string, labs?: ReadonlySet<string>) {
  const posts = cards.filter((c) => c.date.startsWith(year) && (!labs || labs.has(c.lab)));
  const ids = new Set(posts.map((c) => c.id));
  const docs = systemCards.filter((d) => d.release && ids.has(d.release));
  const loose = systemCards.filter((d) => !d.release && d.date.startsWith(year) && (!labs || labs.has(d.lab))).length;
  return { posts: posts.length, docs: docs.length, loose };
}

let cached: RData | null = null;

export function reportingData(): RData {
  if (cached) return cached;
  const famName = familyNames();
  const labs: RLab[] = [];
  const labIdx = new Map<string, number>();
  const lab = (id: string) => {
    if (!labIdx.has(id)) {
      const name = labById.get(id)?.name ?? id;
      labIdx.set(id, labs.length);
      labs.push({ id, name, short: shortName(id, name), mark: COLOR_MARKS.has(id) ? 'color' : MONO_MARKS.has(id) ? 'mono' : 'none', page: labPages.has(id) });
    }
    return labIdx.get(id)!;
  };
  const benches: RBench[] = [];
  const benchIdx = new Map<string, number>();
  const bench = (id: string) => {
    if (!benchIdx.has(id)) {
      const b = benchById.get(id)!;
      benchIdx.set(id, benches.length);
      benches.push({
        id,
        name: b.name,
        org: b.org ?? '',
        fam: b.family ?? b.id,
        famName: b.family ? (famName.get(b.family) ?? b.name) : b.name,
        safety: SAFETY_CATEGORIES.has(b.category ?? ''),
        area: areaOf(b.category),
        makers: [...new Set(makerParts(b.org ?? '').map((p) => p.lab).filter((l): l is string => !!l))],
      });
    }
    return benchIdx.get(id)!;
  };
  const docsFor = new Map<string, typeof systemCards>();
  for (const d of systemCards) if (d.release) docsFor.set(d.release, [...(docsFor.get(d.release) ?? []), d]);
  const rels: RRel[] = [];
  for (const c of cards) {
    const seen = new Map<number, string | null>();
    for (const doc of [c, ...(docsFor.get(c.id) ?? [])])
      for (const r of doc.results) {
        if (!benchById.has(r.benchmark)) continue;
        const bi = bench(r.benchmark);
        const s = r.score == null ? null : fmtScore(r.score, normUnit(r.unit));
        if (!seen.has(bi) || (seen.get(bi) == null && s != null)) seen.set(bi, s);
      }
    if (!seen.size) continue;
    const m = modelById.get(c.model);
    rels.push({ lab: lab(c.lab), model: m?.name ?? c.model, href: featuredIds.has(c.model) ? `/models/${c.model}/` : null, date: c.date, r: [...seen.entries()] });
  }
  const years = [...new Set(rels.map((r) => r.date.slice(0, 4)))].filter((y) => y >= FIRST_YEAR).sort().reverse();
  const sources = Object.fromEntries(
    years.map((y) => {
      const all = sourceCounts(y);
      const fr = sourceCounts(y, FRONTIER);
      return [y, { posts: all.posts, docs: all.docs, frontier: { posts: fr.posts, docs: fr.docs } }];
    }),
  );
  cached = { labs, benches, rels, years, areas: AREAS.map((a) => ({ id: a.id, name: a.name })), sources, asOf: AS_OF };
  return cached;
}

/** The year the page opens on: the latest one. */
export const currentYear = () => reportingData().years[0];

/** The frontier labs' names, in the list's order. */
export const frontierNames = () => FRONTIER_LABS.map((id) => labById.get(id)?.name ?? id);

/** One benchmark family's name, link, area and maker, from the version labs named most. */
function famInfo(d: RData) {
  const counts = new Map<string, Map<number, number>>();
  for (const rel of d.rels)
    for (const [bi] of rel.r) {
      const f = d.benches[bi].fam;
      const m = counts.get(f) ?? counts.set(f, new Map()).get(f)!;
      m.set(bi, (m.get(bi) ?? 0) + 1);
    }
  return (fam: string) => {
    const top = [...(counts.get(fam) ?? new Map<number, number>()).entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const b = top != null ? d.benches[top] : undefined;
    return { name: b?.famName ?? fam, href: b ? `/benchmarks/${b.id}/` : `/benchmarks/${fam}/`, area: b?.area ?? 'other', org: b?.org ?? '' };
  };
}

export interface BumpCol {
  label: string;
  /** A quieter second line: "whole year" or "so far". */
  sub: string;
  /** Releases with scores in the column. */
  n: number;
}
export interface BumpLine {
  key: string;
  name: string;
  href: string;
  area: string;
  /** Rank in each column, 1 to 10, or null when outside the top ten. */
  ranks: (number | null)[];
  /** Share of the column's releases that named it, where it ranks. */
  shares: (number | null)[];
  counts: (number | null)[];
}

/**
 * The ten benchmarks named in the most releases, column by column: 2024 as one column (labs published few launch
 * posts with scores that year), then each quarter from 2025. Ties go to the one more labs named, then by name.
 * Safety evaluations are left out, and versions count as one benchmark.
 */
export function bump(labs?: ReadonlySet<string>): { cols: BumpCol[]; lines: BumpLine[] } {
  const d = reportingData();
  const info = famInfo(d);
  const colOf = (date: string) => (date < '2025' ? (date >= FIRST_YEAR ? FIRST_YEAR : null) : `${date.slice(0, 4)}-${Math.floor((Number(date.slice(5, 7)) - 1) / 3) + 1}`);
  const tally = new Map<string, { n: number; cnt: Map<string, number>; labs: Map<string, Set<number>> }>();
  for (const rel of d.rels) {
    const c = colOf(rel.date);
    if (!c || (labs && !labs.has(d.labs[rel.lab].id))) continue;
    const keys = new Set(rel.r.map(([bi]) => d.benches[bi]).filter((b) => !b.safety).map((b) => b.fam));
    if (!keys.size) continue;
    const t = tally.get(c) ?? tally.set(c, { n: 0, cnt: new Map(), labs: new Map() }).get(c)!;
    t.n++;
    for (const k of keys) {
      t.cnt.set(k, (t.cnt.get(k) ?? 0) + 1);
      (t.labs.get(k) ?? t.labs.set(k, new Set()).get(k)!).add(rel.lab);
    }
  }
  const keys = [...tally.keys()].sort();
  const last = keys.at(-1);
  const cols: BumpCol[] = keys.map((k) =>
    k === FIRST_YEAR
      ? { label: FIRST_YEAR, sub: 'whole year', n: tally.get(k)!.n }
      : { label: `Q${k.slice(5)} ${k.slice(0, 4)}`, sub: k === last && AS_OF < quarterEnd(k) ? 'so far' : '', n: tally.get(k)!.n },
  );
  const tops = keys.map((k) => {
    const t = tally.get(k)!;
    return [...t.cnt.entries()]
      .sort((a, b) => b[1] - a[1] || t.labs.get(b[0])!.size - t.labs.get(a[0])!.size || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([key, count]) => ({ key, count, share: count / t.n }));
  });
  const all = [...new Set(tops.flat().map((t) => t.key))];
  const lines = all.map((key) => {
    const at = tops.map((t) => t.findIndex((x) => x.key === key));
    return {
      key,
      ...info(key),
      ranks: at.map((i) => (i < 0 ? null : i + 1)),
      shares: at.map((i, c) => (i < 0 ? null : tops[c][i].share)),
      counts: at.map((i, c) => (i < 0 ? null : tops[c][i].count)),
    };
  });
  return { cols, lines };
}

/** The last day of a quarter key such as "2026-4". */
function quarterEnd(k: string) {
  const y = Number(k.slice(0, 4));
  const q = Number(k.slice(5));
  return new Date(Date.UTC(y, q * 3, 0)).toISOString().slice(0, 10);
}

export interface SpreadLine {
  key: string;
  name: string;
  href: string;
  area: string;
  /** The day a lab first named it. */
  first: string;
  /** Days after the first, one per lab, the day each lab first named it (the first is 0). */
  days: number[];
  /** Days from the first to the data's last day. */
  end: number;
  /** Days to the tenth lab, if it got there. */
  d10: number | null;
}

/** The earliest release month of any version, when the benchmark records one. */
function familyReleased(): Map<string, string> {
  const out = new Map<string, string>();
  for (const b of benchmarks) {
    const k = b.family ?? b.id;
    if (b.released && (!out.has(k) || b.released < out.get(k)!)) out.set(k, b.released);
  }
  return out;
}

const dayGap = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

/**
 * How fast new benchmarks spread from lab to lab: every benchmark released in 2025 or later that at least five labs
 * have named, with the day each lab first named it. Only benchmarks released after our launch posts grow dense,
 * so the first lab we see is the first lab there was. Safety evaluations are left out.
 */
export function spread(minLabs = 5, labs?: ReadonlySet<string>): SpreadLine[] {
  const d = reportingData();
  const info = famInfo(d);
  const released = familyReleased();
  const first = new Map<string, Map<number, string>>();
  for (const rel of d.rels)
    for (const [bi] of rel.r) {
      const b = d.benches[bi];
      if (b.safety || (labs && !labs.has(d.labs[rel.lab].id))) continue;
      const m = first.get(b.fam) ?? first.set(b.fam, new Map()).get(b.fam)!;
      const f = m.get(rel.lab);
      if (!f || rel.date < f) m.set(rel.lab, rel.date);
    }
  const out: SpreadLine[] = [];
  for (const [key, m] of first) {
    if ((released.get(key) ?? '0') < '2025' || m.size < minLabs) continue;
    const dates = [...m.values()].sort();
    const days = dates.map((x) => dayGap(dates[0], x));
    out.push({ key, ...info(key), first: dates[0], days, end: dayGap(dates[0], AS_OF), d10: days.length >= 10 ? days[9] : null });
  }
  return out.sort((a, b) => b.days.length - a.days.length || a.name.localeCompare(b.name));
}

export const asOf = AS_OF;
