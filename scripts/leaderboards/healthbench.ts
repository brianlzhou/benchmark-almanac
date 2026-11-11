// HealthBench overall scores from the author's launch page. In the theme chart, theme:null
// denotes the published overall value. Do not average the overlapping theme categories.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { openaiSpecs, chartValues, OPENAI_TERMS } from '../lib/boards/openai-cov8.ts';
const PAGE = 'https://openai.com/index/healthbench/';
const board: Leaderboard = {
  benchmark: 'healthbench', url: PAGE, feed: `${PAGE} (HealthBench scores by theme, overall values)`, terms: OPENAI_TERMS,
  aliases: { 'Gemini 2.5 Pro (Mar 2025)': 'gemini-2-5-pro-mar-2025', 'GPT-4o (Aug 2024)': 'gpt-4o-aug-2024' },
  async fetch() {
    const values = chartValues(await openaiSpecs(PAGE), 'HealthBench scores by theme');
    const rows: LeaderboardRow[] = [];
    for (const r of values) {
      if (r.theme !== null || typeof r.model !== 'string' || typeof r.success_rate !== 'number') continue;
      let model = r.model.replace(/\s+/g, ' ').trim();
      if (model === 'GPT-3.5 Turbo') model += ' (snapshot unspecified)';
      const metrics: Record<string, number> = {};
      for (const part of values.filter(p => p.model === r.model && typeof p.theme === 'string')) {
        if (typeof part.success_rate === 'number') metrics[String(part.theme).toLowerCase().replace(/[^a-z0-9]+/g, '_')] = part.success_rate * 100;
      }
      rows.push({ model, score: r.success_rate * 100, metrics });
    }
    if (!rows.length) throw new Error('HealthBench overall values missing');
    return rows;
  },
};
export default board;
