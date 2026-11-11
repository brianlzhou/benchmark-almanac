// FrontierScience Research has separate model and reasoning-effort charts. Keep the Research
// accuracy percentage and confidence limits. Do not mix in the Olympiad task set.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { openaiSpecs, chartValues, OPENAI_TERMS } from '../lib/boards/openai-cov8.ts';
const PAGE = 'https://openai.com/index/frontierscience/';
const board: Leaderboard = {
  benchmark: 'frontierscience-research', url: PAGE, feed: `${PAGE} (Research model and effort charts)`, terms: OPENAI_TERMS,
  async fetch() {
    const specs = await openaiSpecs(PAGE), rows: LeaderboardRow[] = [];
    const efforts = chartValues(specs, 'FrontierScience-Research accuracy across reasoning efforts');
    const families = new Set(efforts.map(r => r.family));
    for (const r of [...chartValues(specs, 'FrontierScience-Research accuracy across models').filter(r => !families.has(r.model)), ...efforts]) {
      if (typeof r.accuracy_pct !== 'number' || typeof r.model !== 'string') continue;
      let model = (typeof r.family === 'string' ? r.family : r.model).replace(/^OpenAI /, '');
      if (model === 'GPT-4o') model += ' (snapshot unspecified)';
      const metrics: Record<string, number> = {};
      if (typeof r.ci95_low_pct === 'number') metrics.ciLow = r.ci95_low_pct;
      if (typeof r.ci95_high_pct === 'number') metrics.ciHigh = r.ci95_high_pct;
      rows.push({ model, score: r.accuracy_pct, setting: r.family ? r.model.toLowerCase() : 'maximum reasoning', metrics });
    }
    if (!rows.length) throw new Error('FrontierScience Research has no accuracy rows');
    return rows;
  },
};
export default board;
