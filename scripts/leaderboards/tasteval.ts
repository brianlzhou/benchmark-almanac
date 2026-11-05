// TasteVal (P-Zero Research). The post's chart ("experiment compute multiplier against model release date")
// reads an inline JSON block, <script type="application/json" id="chart-data">, with one point per model: m,
// the experiment compute multiplier relative to human experts (1.0 = expert level, higher is better), and a
// 95% bootstrap interval. m is the headline; the record's unit is %, so the score is m x 100, the percent of
// human-expert experimental efficiency (100 = experts), which also keeps small multipliers from rounding
// away. The point's date is the model's release date, not a run date, so it is not passed; the parenthesis
// is the setting. The point's 95% bootstrap interval (lo, hi) is kept, on the same scale, as metrics.ciLow
// and ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://pzeroresearch.com/work/tasteval/';

const board: Leaderboard = {
  benchmark: 'tasteval',
  url: PAGE,
  feed: `${PAGE} (inline chart-data JSON, m)`,
  terms: 'Public research post; robots.txt allows general agents (it blocks named AI crawlers) with content signals search=yes, ai-train=no, use=reference, and this reads the numbers for reference only.',
  aliases: {
    'GPT-4': 'gpt-4-jun-2023',
    'GPT-4o': 'gpt-4o-may-2024',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const raw = html.match(/<script type="application\/json" id="chart-data">([\s\S]*?)<\/script>/)?.[1];
    if (!raw) throw new Error('chart-data block not found');
    const data = JSON.parse(raw) as { points: { model: string; m: number; lo?: number; hi?: number }[] };
    const rows: LeaderboardRow[] = [];
    for (const p of data.points ?? []) {
      if (!p.model || !Number.isFinite(p.m)) continue;
      const paren = p.model.match(/^(.*?)\s*\(([^)]+)\)$/);
      const ci = Number.isFinite(p.lo) && Number.isFinite(p.hi) ? { metrics: { ciLow: Number((p.lo! * 100).toFixed(2)), ciHigh: Number((p.hi! * 100).toFixed(2)) } } : {};
      rows.push({ model: paren ? paren[1] : p.model, setting: paren ? paren[2].replace(/\s+effort$/i, '') : undefined, score: Number((p.m * 100).toFixed(2)), ...ci });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} TasteVal points`);
    return rows;
  },
};
export default board;
