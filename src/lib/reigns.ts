// Who held number one, and when. A model takes the top spot on the day a score beats every earlier score
// (its release date for independent runs, the card's date for lab claims). It keeps the spot until a
// later model beats it. Ties leave the incumbent in place.
import { epochScores, cardScores, benchById, modelById, eciByModel, models, AS_OF } from './data.ts';
import type { Score } from './types.ts';

export type Source = 'epoch' | 'card';

export interface Reign {
  model: string;
  lab?: string;
  start: string;
  end: string;
  /** Best score while this model held the top spot, one step per improvement. */
  steps: { date: string; value: number }[];
}

export interface ReignRow {
  benchmark: string;
  source: Source;
  unit: string;
  reigns: Reign[];
  /** Range used to draw heights: 0 to 100 for percentages, else the data's range. */
  domain: [number, number];
}

function build(points: { date: string; value: number; model: string }[], better: 'higher' | 'lower', unit: string): Omit<ReignRow, 'benchmark' | 'source'> | null {
  const pts = points.filter((p) => p.date && p.date <= AS_OF).sort((a, b) => a.date.localeCompare(b.date));
  if (pts.length < 3) return null;
  const sign = better === 'lower' ? -1 : 1;
  const reigns: Reign[] = [];
  for (const p of pts) {
    const cur = reigns.at(-1);
    const best = cur?.steps.at(-1)?.value;
    if (best !== undefined && sign * p.value <= sign * best) continue;
    if (cur && cur.model === p.model) {
      cur.steps.push({ date: p.date, value: p.value });
      continue;
    }
    if (cur) cur.end = p.date;
    reigns.push({ model: p.model, lab: modelById.get(p.model)?.lab, start: p.date, end: AS_OF, steps: [{ date: p.date, value: p.value }] });
  }
  const vals = pts.map((p) => p.value);
  const domain: [number, number] = unit === '%' ? [0, 100] : [Math.min(0, ...vals), Math.max(...vals)];
  return { unit, reigns, domain };
}

const cache = new Map<string, ReignRow | null>();

export function reignRow(benchmark: string, source: Source): ReignRow | null {
  const k = `${benchmark}|${source}`;
  if (cache.has(k)) return cache.get(k)!;
  const b = benchById.get(benchmark);
  let row: ReignRow | null = null;
  if (b) {
    const unit = b.unit ?? '%';
    const scores: Score[] = (source === 'epoch' ? epochScores : cardScores).filter((s) => s.benchmark === benchmark && s.unit === unit);
    const built = build(
      scores.map((s) => ({ date: s.date ?? '', value: s.value, model: s.model })),
      b.better === 'lower' ? 'lower' : 'higher',
      unit,
    );
    row = built ? { benchmark, source, ...built } : null;
  }
  cache.set(k, row);
  return row;
}

/** Number one on the Epoch Capabilities Index, by release date. */
export function eciReigns(): ReignRow | null {
  const pts = models.filter((m) => eciByModel.has(m.id) && m.released).map((m) => ({ date: m.released!, value: eciByModel.get(m.id)!.eci, model: m.id }));
  const built = build(pts, 'higher', 'index');
  return built ? { benchmark: 'eci', source: 'epoch', ...built } : null;
}

const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

/** Share of benchmark-days each lab held number one, across the given rows. */
export function labShares(rows: ReignRow[], since = '2023-01-01'): { lab: string; days: number; share: number }[] {
  const tot = new Map<string, number>();
  let all = 0;
  for (const r of rows)
    for (const g of r.reigns) {
      const d = days(g.start < since ? since : g.start, g.end);
      if (d <= 0) continue;
      const lab = g.lab ?? 'other';
      tot.set(lab, (tot.get(lab) ?? 0) + d);
      all += d;
    }
  return [...tot.entries()].map(([lab, d]) => ({ lab, days: d, share: all ? d / all : 0 })).sort((a, b) => b.days - a.days);
}

export const reignDays = (g: Reign) => days(g.start, g.end);
