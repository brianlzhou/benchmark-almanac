// The Reporting page's matrix and lab table, as pure functions of a compact data set (src/lib/reporting.ts builds
// it, /reporting.json serves it). The page renders the default view with these on the server, and its script
// renders every other view with the same code, so the two never drift. No data imports here: the browser loads
// this file.

export interface RLab {
  id: string;
  name: string;
  /** A short name for a column head ("Google" for Google DeepMind). */
  short: string;
  mark: 'color' | 'mono' | 'none';
}
export interface RBench {
  id: string;
  name: string;
  org: string;
  /** The family id, or the benchmark's own id when it has no versions. */
  fam: string;
  famName: string;
  /** Safety, alignment, bio-chem and cyber evaluations, left out by default. */
  safety: boolean;
  /** Labs among the benchmark's makers, for "made by the lab". */
  makers: string[];
}
export interface RRel {
  /** Index into labs. */
  lab: number;
  model: string;
  /** The model's page, when it has one. */
  href: string | null;
  date: string;
  /** Each benchmark the release names, once: [index into benches, the score as written or null]. */
  r: [number, string | null][];
}
export interface RData {
  labs: RLab[];
  benches: RBench[];
  rels: RRel[];
  years: string[];
}

export type Names = 'grouped' | 'exact';
export type SortKey = 'labs' | 'releases' | 'name';
export interface View {
  year: string;
  names: Names;
  min: number;
  sort: SortKey;
  q: string;
  safety: boolean;
}

export const COLS = 12;

export interface Row {
  key: string;
  name: string;
  org: string;
  href: string;
  labs: number;
  releases: number;
  /** Release indexes per lab index. */
  byLab: Map<number, number[]>;
}

export interface Matrix {
  /** Lab indexes shown as columns, most releases with scores first. */
  cols: number[];
  /** Labs with at least one release with scores in the year. */
  totalLabs: number;
  otherLabs: number;
  releases: number;
  rows: Row[];
  /** Rows that pass the threshold, sorted. */
  passing: Row[];
  /** Rows that pass the threshold and the search. */
  shown: Row[];
  maxReleases: number;
}

const keyOf = (b: RBench, names: Names) => (names === 'grouped' ? b.fam : b.id);

/** The releases of the year and the benchmarks each names, keyed by the view's naming. */
function uses(d: RData, v: View) {
  const out: { rel: number; keys: Map<string, number[]> }[] = [];
  d.rels.forEach((rel, i) => {
    if (!rel.date.startsWith(v.year)) return;
    const keys = new Map<string, number[]>();
    for (const [bi] of rel.r) {
      const b = d.benches[bi];
      if (b.safety && !v.safety) continue;
      const k = keyOf(b, v.names);
      keys.set(k, [...(keys.get(k) ?? []), bi]);
    }
    if (keys.size) out.push({ rel: i, keys });
  });
  return out;
}

export function matrix(d: RData, v: View): Matrix {
  const us = uses(d, v);
  const relsPerLab = new Map<number, number>();
  for (const u of us) relsPerLab.set(d.rels[u.rel].lab, (relsPerLab.get(d.rels[u.rel].lab) ?? 0) + 1);
  const cols = [...relsPerLab.entries()]
    .sort((a, b) => b[1] - a[1] || d.labs[a[0]].name.localeCompare(d.labs[b[0]].name))
    .slice(0, COLS)
    .map(([l]) => l);
  const rows = new Map<string, Row & { members: Map<number, number> }>();
  for (const u of us) {
    const lab = d.rels[u.rel].lab;
    for (const [k, bis] of u.keys) {
      let row = rows.get(k);
      if (!row) {
        const b = d.benches[bis[0]];
        row = { key: k, name: v.names === 'grouped' ? b.famName : b.name, org: '', href: '', labs: 0, releases: 0, byLab: new Map(), members: new Map() };
        rows.set(k, row);
      }
      row.releases++;
      row.byLab.set(lab, [...(row.byLab.get(lab) ?? []), u.rel]);
      for (const bi of bis) row.members.set(bi, (row.members.get(bi) ?? 0) + 1);
    }
  }
  for (const row of rows.values()) {
    row.labs = row.byLab.size;
    // a grouped row links to, and credits the maker of, the version labs named most
    const top = [...row.members.entries()].sort((a, b) => b[1] - a[1])[0][0];
    row.href = `/benchmarks/${d.benches[top].id}/`;
    row.org = d.benches[top].org;
  }
  const all = [...rows.values()];
  const cmp: Record<SortKey, (a: Row, b: Row) => number> = {
    labs: (a, b) => b.labs - a.labs || b.releases - a.releases || a.name.localeCompare(b.name),
    releases: (a, b) => b.releases - a.releases || b.labs - a.labs || a.name.localeCompare(b.name),
    name: (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  };
  const passing = all.filter((r) => r.labs >= v.min).sort(cmp[v.sort]);
  const q = v.q.trim().toLowerCase();
  const shown = q ? passing.filter((r) => r.name.toLowerCase().includes(q) || r.org.toLowerCase().includes(q)) : passing;
  return {
    cols,
    totalLabs: relsPerLab.size,
    otherLabs: Math.max(0, relsPerLab.size - cols.length),
    releases: us.length,
    rows: all,
    passing,
    shown,
    maxReleases: Math.max(1, ...passing.map((r) => r.releases)),
  };
}

/** The bins of the cell scale: 1, 2, 3, 4, 5 to 6, 7 to 9, 10 or more. */
export const BINS = [
  { label: '1', test: (n: number) => n === 1 },
  { label: '2', test: (n: number) => n === 2 },
  { label: '3', test: (n: number) => n === 3 },
  { label: '4', test: (n: number) => n === 4 },
  { label: '5 to 6', test: (n: number) => n >= 5 && n <= 6 },
  { label: '7 to 9', test: (n: number) => n >= 7 && n <= 9 },
  { label: '10+', test: (n: number) => n >= 10 },
];
export const binOf = (n: number) => BINS.findIndex((b) => b.test(n));

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

export function markHtml(l: RLab | undefined, size = 18): string {
  if (!l) return '';
  if (l.mark === 'color') return `<img class="rp-mk" src="/labs/${esc(l.id)}-color.svg" width="${size}" height="${size}" alt="" />`;
  if (l.mark === 'mono') return `<span class="rp-mk rp-mask" style="--m:url(/labs/${esc(l.id)}.svg)" aria-hidden="true"></span>`;
  return `<span class="rp-mk rp-init" aria-hidden="true">${esc(l.name.slice(0, 1))}</span>`;
}

export function headHtml(d: RData, m: Matrix): string {
  const labs = m.cols
    .map((l) => `<th class="rp-lc" scope="col"><span class="rp-lh" title="${esc(d.labs[l].name)}">${markHtml(d.labs[l])}<span>${esc(d.labs[l].short)}</span></span></th>`)
    .join('');
  const other = m.otherLabs
    ? `<th class="rp-lc rp-oc" scope="col"><span class="rp-lh"><span class="rp-mk rp-init" aria-hidden="true">+</span><span>${m.otherLabs} other${m.otherLabs === 1 ? '' : 's'}</span></span></th>`
    : '';
  return `<tr><th class="rp-bn" scope="col">Benchmark</th>${labs}${other}<th class="rp-tc" scope="col">Labs</th><th class="rp-tc rp-rc" scope="col">Releases</th></tr>`;
}

function cellHtml(rels: number[] | undefined, row: number, col: number): string {
  const n = rels?.length ?? 0;
  if (!n) return `<td class="rp-c" data-row="${row}" data-col="${col}" tabindex="-1"></td>`;
  return `<td class="rp-c rp-b${binOf(n)}" data-row="${row}" data-col="${col}" data-r="${rels!.join(',')}" tabindex="-1">${n}</td>`;
}

export function bodyHtml(d: RData, m: Matrix): string {
  if (!m.shown.length) return `<tr class="rp-none"><td colspan="${m.cols.length + (m.otherLabs ? 4 : 3)}">No benchmark matches. Try a lower threshold or another name.</td></tr>`;
  return m.shown
    .map((r, ri) => {
      const cells = m.cols.map((l, ci) => cellHtml(r.byLab.get(l), ri, ci)).join('');
      let other = '';
      if (m.otherLabs) {
        const rest = [...r.byLab.entries()].filter(([l]) => !m.cols.includes(l)).flatMap(([, x]) => x);
        other = cellHtml(rest.length ? rest : undefined, ri, m.cols.length).replace('class="rp-c', 'class="rp-c rp-oc');
      }
      const lw = Math.round((r.labs / Math.max(1, m.totalLabs)) * 100);
      const rw = Math.round((r.releases / m.maxReleases) * 100);
      return (
        `<tr data-key="${esc(r.key)}"><th class="rp-bn" scope="row"><span class="rp-rk num">${ri + 1}</span><a href="${r.href}">${esc(r.name)}</a>` +
        (r.org ? ` <span class="rp-org">${esc(r.org)}</span>` : '') +
        `</th>${cells}${other}` +
        `<td class="rp-tc num"><span class="rp-bar" aria-hidden="true"><i style="width:${lw}%"></i></span>${r.labs}<span class="rp-of">/${m.totalLabs}</span></td>` +
        `<td class="rp-tc rp-rc num"><span class="rp-bar" aria-hidden="true"><i style="width:${rw}%"></i></span>${r.releases}</td></tr>`
      );
    })
    .join('');
}

export function statusText(m: Matrix, v: View): string {
  const all = m.rows.length.toLocaleString('en-US');
  const yr = v.year;
  const thr = v.min <= 1 ? `all ${m.passing.length.toLocaleString('en-US')} benchmarks the ${m.totalLabs} labs named in ${yr}` : `the ${m.passing.length.toLocaleString('en-US')} benchmarks that at least ${v.min} labs named in ${yr}`;
  if (v.q.trim()) {
    const hidden = m.rows.filter((r) => r.labs < v.min && (r.name.toLowerCase().includes(v.q.trim().toLowerCase()) || r.org.toLowerCase().includes(v.q.trim().toLowerCase()))).length;
    return `${m.shown.length.toLocaleString('en-US')} ${m.shown.length === 1 ? 'match' : 'matches'} among ${thr}.${hidden ? ` ${hidden} more ${hidden === 1 ? 'match' : 'match'} at a lower threshold.` : ''}`;
  }
  return v.min <= 1 ? `Showing ${thr}.` : `Showing ${thr}, out of ${all} in total.`;
}

export interface LabHabit {
  lab: number;
  releases: number;
  median: number;
  made: number;
  shared: number;
  uses: number;
}

/** Each lab's reporting in the year: releases with scores, the median count per release, and two shares of its uses. */
export function labHabits(d: RData, v: View): LabHabit[] {
  const us = uses(d, v);
  const labsPerKey = new Map<string, Set<number>>();
  for (const u of us) for (const k of u.keys.keys()) labsPerKey.set(k, (labsPerKey.get(k) ?? new Set()).add(d.rels[u.rel].lab));
  const by = new Map<number, { counts: number[]; made: number; shared: number; uses: number }>();
  for (const u of us) {
    const lab = d.rels[u.rel].lab;
    const labId = d.labs[lab].id;
    const h = by.get(lab) ?? { counts: [], made: 0, shared: 0, uses: 0 };
    h.counts.push(u.keys.size);
    for (const [k, bis] of u.keys) {
      h.uses++;
      if (bis.some((bi) => d.benches[bi].makers.includes(labId))) h.made++;
      const others = [...(labsPerKey.get(k) ?? [])].filter((l) => l !== lab).length;
      if (others >= 3) h.shared++;
    }
    by.set(lab, h);
  }
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  return [...by.entries()]
    .map(([lab, h]) => ({ lab, releases: h.counts.length, median: median(h.counts), made: h.made / h.uses, shared: h.shared / h.uses, uses: h.uses }))
    .sort((a, b) => b.releases - a.releases || b.uses - a.uses || d.labs[a.lab].name.localeCompare(d.labs[b.lab].name));
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const half = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));

export function habitsHtml(d: RData, hs: LabHabit[]): string {
  return hs
    .map(
      (h) =>
        `<tr><td><span class="rp-lab">${markHtml(d.labs[h.lab])}<a href="/labs/${esc(d.labs[h.lab].id)}/">${esc(d.labs[h.lab].name)}</a></span></td>` +
        `<td class="r num">${h.releases}</td><td class="r num">${half(h.median)}</td>` +
        `<td class="r num"><span class="rp-share"><span class="rp-bar" aria-hidden="true"><i style="width:${Math.round(h.made * 100)}%"></i></span>${pct(h.made)}</span></td>` +
        `<td class="r num"><span class="rp-share"><span class="rp-bar" aria-hidden="true"><i style="width:${Math.round(h.shared * 100)}%"></i></span>${pct(h.shared)}</span></td></tr>`,
    )
    .join('');
}

export const DEFAULT_VIEW = (year: string): View => ({ year, names: 'grouped', min: 3, sort: 'labs', q: '', safety: false });
