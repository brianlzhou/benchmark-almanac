// Vision2Web season boards use different judges. Keep each season separate and its subtask scores in metrics.
import type { LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';
export const VISION2WEB_FEED = 'https://vision2web-bench.github.io/data/leaderboard.json';
export const VISION2WEB_TERMS = 'The official GitHub Pages JSON states no separate reuse terms; the almanac credits and links the Vision2Web authors.';
interface Model { name: string; date?: string; params?: string; overall?: number | null; l1?: Record<string, number>; l2?: Record<string, number>; l3?: Record<string, number> }
function parseParams(s?: string): number | undefined {
  const m = s?.trim().match(/^(\d+(?:\.\d+)?)\s*([TBM])$/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  const u = m[2].toUpperCase();
  return u === 'T' ? n * 1000 : u === 'M' ? n / 1000 : n;
}
export async function vision2webSeason(season: string): Promise<LeaderboardRow[]> {
  const data = await fetchJson<{seasons: Record<string, {models: Model[]}>}>(VISION2WEB_FEED);
  if (!data.seasons[season]) throw new Error(`Vision2Web season missing: ${season}`);
  const rows: LeaderboardRow[] = [];
  for (const m of data.seasons[season].models) {
    if (typeof m.overall !== 'number' || !Number.isFinite(m.overall)) continue;
    const [model, ...agent] = m.name.split(' + ');
    const metrics: Record<string, number> = {};
    for (const level of ['l1', 'l2', 'l3'] as const)
      for (const [key, value] of Object.entries(m[level] ?? {}))
        if (typeof value === 'number' && Number.isFinite(value)) metrics[`${level}_${key}`] = value;
    const params = parseParams(m.params);
    rows.push({model: model.trim(), score: m.overall, harness: agent.join(' + ').trim() || undefined, date: m.date, ...(params ? {params} : {}), metrics});
  }
  if (!rows.length) throw new Error(`Vision2Web has no scores for ${season}`);
  return rows;
}
