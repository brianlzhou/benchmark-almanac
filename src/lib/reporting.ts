// The data behind the Reporting page: which benchmarks labs name for their releases. A release is a launch post
// (data/cards.json). The system cards, model cards and technical reports published with it (data/system-cards.json,
// linked by `release`) add to the same release, so a benchmark counts once per release however many documents or
// settings report it. reporting-view.ts turns this into the matrix and the lab table.

import { cards, systemCards, labById, modelById, benchmarks, benchById, labPages, normUnit, AS_OF } from './data.ts';
import { featuredIds } from './routes.ts';
import { makerParts } from './makers.ts';
import { COLOR_MARKS, MONO_MARKS } from './marks.ts';
import { score as fmtScore } from './format.ts';
import type { Benchmark } from './types.ts';
import type { RData, RLab, RBench, RRel } from './reporting-view.ts';

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
    for (let prev = ''; prev !== p; ) {
      prev = p;
      p = p.replace(/\d+$/, '').replace(/\s+v$/i, '').replace(/[\s\-–:(,.]+$/, '');
    }
    // the shared part has to end at a word boundary in every name ("OSWorld" in "OSWorld-Verified" does)
    const clean = p.length >= 3 && names.every((n) => n.length === p.length || !/[A-Za-z]/.test(n[p.length]) || /^[A-Z]/.test(n.slice(p.length)));
    const own = bs.find((b) => b.id === fam);
    const oldest = [...bs].sort((a, b) => (a.released ?? '9').localeCompare(b.released ?? '9'))[0];
    out.set(fam, clean ? p : (own ?? oldest).name);
  }
  return out;
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
        makers: [...new Set(makerParts(b.org ?? '').map((p) => p.lab).filter((l): l is string => !!l))],
      });
    }
    return benchIdx.get(id)!;
  };
  const docsFor = new Map<string, typeof systemCards>();
  for (const d of systemCards) if (d.release) docsFor.set(d.release, [...(docsFor.get(d.release) ?? []), d]);
  const rels: RRel[] = [];
  for (const c of cards) {
    if (c.date < FIRST_YEAR) continue;
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
  const years = [...new Set(rels.map((r) => r.date.slice(0, 4)))].sort().reverse();
  cached = { labs, benches, rels, years };
  return cached;
}

/** The year the page opens on: the latest one. */
export const currentYear = () => reportingData().years[0];

/** Launch posts and linked documents counted in a year, and how many documents had no launch post to join. */
export function sourceCounts(year: string) {
  const posts = cards.filter((c) => c.date.startsWith(year));
  const ids = new Set(posts.map((c) => c.id));
  const docs = systemCards.filter((d) => d.release && ids.has(d.release));
  const loose = systemCards.filter((d) => !d.release && d.date.startsWith(year)).length;
  return { posts: posts.length, docs: docs.length, loose };
}

export interface Adoption {
  key: string;
  name: string;
  href: string;
  /** Every lab's first release naming the benchmark, oldest first. */
  firsts: { lab: string; labName: string; model: string; date: string }[];
}

/**
 * How fast the most widely named benchmarks spread: for each, every lab's first release that names it, across
 * all years. Families count as one benchmark, and safety evaluations are left out, as in the default matrix.
 */
export function adoption(keys: string[]): Adoption[] {
  const d = reportingData();
  return keys.map((key) => {
    const first = new Map<number, RRel>();
    let name = key;
    const members = new Map<number, number>();
    for (const rel of d.rels)
      for (const [bi] of rel.r) {
        const b = d.benches[bi];
        if (b.fam !== key) continue;
        name = b.famName;
        members.set(bi, (members.get(bi) ?? 0) + 1);
        const f = first.get(rel.lab);
        if (!f || rel.date < f.date) first.set(rel.lab, rel);
      }
    const top = [...members.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      key,
      name,
      href: top != null ? `/benchmarks/${d.benches[top].id}/` : `/benchmarks/${key}/`,
      firsts: [...first.entries()]
        .map(([l, rel]) => ({ lab: d.labs[l].id, labName: d.labs[l].name, model: rel.model, date: rel.date }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  });
}

export const asOf = AS_OF;
