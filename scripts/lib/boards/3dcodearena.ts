// 3DCodeArena publishes all model ratings in its server-rendered Next.js payload.
// Combined BT Elo is the headline. Text/image slices and online Elo remain metrics.
import type { LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { nextFlight, jsonAfter, text } from '../html.ts';

interface Model { slug: string; display_name: string; bt_elo_combined: number; [key: string]: unknown }
export async function code3dRows(agent = false): Promise<LeaderboardRow[]> {
  const html = await fetchText('https://www.3dcodebench.com/leaderboard');
  const models = jsonAfter<Model[]>(nextFlight(html), '"models":');
  const costs = new Map<string, number>();
  if (!agent) {
    await new Promise(r => setTimeout(r, 1100));
    const home = await fetchText('https://www.3dcodebench.com/');
    const chart = home.slice(home.indexOf('Cost vs. Human-Preference Elo'), home.indexOf('Human-preference Elo vs. automated metrics'));
    for (const m of chart.matchAll(/<text\b[^>]*>([^<]+)<\/text><text\b[^>]*>([\s\S]*?)<\/text>/g)) {
      const cost = text(m[2]).match(/^\$\s*([\d.]+)\s*\//);
      if (cost) costs.set(text(m[1]), Number(cost[1]));
    }
    if (costs.size < 5) throw new Error('3DCodeArena cost chart missing');
  }
  const rows: LeaderboardRow[] = [];
  for (const m of models) {
    const isAgent = /(-claude-code|-codex|-gcli)$/.test(m.slug) || m.slug === 'antigravity';
    if (isAgent !== agent || !Number.isFinite(m.bt_elo_combined)) continue;
    const parts = m.display_name.split(' · ');
    const metrics: Record<string, number> = {};
    for (const [key, value] of Object.entries(m)) {
      if (key !== 'id' && typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
    }
    if (typeof m.bt_elo_combined_lo === 'number') metrics.ciLow = m.bt_elo_combined_lo;
    if (typeof m.bt_elo_combined_hi === 'number') metrics.ciHigh = m.bt_elo_combined_hi;
    const cost = costs.get(m.display_name);
    if (cost !== undefined) metrics.listPriceCostPerQuery = cost;
    rows.push({ model: agent ? parts[0].replace(/^Fable /, 'Claude Fable ') : m.slug, score: m.bt_elo_combined,
      ...(agent ? { harness: parts.slice(1).join(' · ') } : {}), ...(cost !== undefined ? { cost } : {}), metrics });
  }
  if (!rows.length) throw new Error('3DCodeArena ratings missing');
  return rows;
}
