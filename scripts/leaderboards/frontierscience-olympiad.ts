// FrontierScience Olympiad: official accuracy percentages, retaining reasoning-effort configurations.
// Research results are a different task set and never enter this importer. Confidence bounds are percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { openaiSpecs, chartValues, OPENAI_TERMS } from '../lib/boards/openai.ts';
const PAGE = 'https://openai.com/index/frontierscience/';
const board: Leaderboard = {
  benchmark: 'frontierscience-olympiad', url: PAGE, feed: `${PAGE} (Olympiad model and reasoning-effort charts)`, terms: OPENAI_TERMS,
  async fetch() {
    const specs = await openaiSpecs(PAGE);
    const main = chartValues(specs, 'FrontierScience-Olympiad accuracy across models');
    const efforts = chartValues(specs, 'FrontierScience-Olympiad accuracy across reasoning efforts');
    const rows: LeaderboardRow[] = [];
    const families = new Set(efforts.map(r => String(r.family)));
    for (const r of [...main.filter(r => !families.has(String(r.model))), ...efforts]) {
      if (typeof r.accuracy_pct !== 'number' || typeof r.model !== 'string') throw new Error('Invalid FrontierScience score');
      let model = String(r.family ?? r.model).replace(/^OpenAI /, '');
      if (model === 'GPT-4o') model += ' (snapshot unspecified)';
      const metrics: Record<string, number> = {};
      if (typeof r.ci95_low_pct === 'number') metrics.ciLow = r.ci95_low_pct;
      if (typeof r.ci95_high_pct === 'number') metrics.ciHigh = r.ci95_high_pct;
      rows.push({ model, score: r.accuracy_pct, setting: r.family ? r.model.toLowerCase() : undefined, metrics });
    }
    return rows;
  },
};
export default board;
