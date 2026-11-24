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
      const low = typeof r.ci95_low_pct === 'number' ? r.ci95_low_pct : undefined;
      const high = typeof r.ci95_high_pct === 'number' ? r.ci95_high_pct : undefined;
      if (low !== undefined) metrics.ciLow = low;
      if (high !== undefined) metrics.ciHigh = high;
      rows.push({ model, score: r.accuracy_pct, setting: r.family ? r.model.toLowerCase() : undefined, ...(low !== undefined && high !== undefined && low <= high ? { low, high } : {}), metrics });
    }
    return rows;
  },
};
export default board;
