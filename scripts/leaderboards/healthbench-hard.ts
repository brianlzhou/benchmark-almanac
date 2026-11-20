// HealthBench Hard: overall scores are the theme=null entries in OpenAI's Hard-subset chart.
// Values are fractions, converted to percent. Axis scores stay in metrics, not separate leaderboard rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { openaiSpecs, chartValues, OPENAI_TERMS } from '../lib/boards/openai.ts';
const PAGE = 'https://openai.com/index/healthbench/';
const board: Leaderboard = {
  benchmark: 'healthbench-hard', parts: {
  'Communication quality': { name: 'Communication quality', group: 'Dimension' },
  'Instruction following': { name: 'Instruction following', group: 'Dimension' },
  Accuracy: { name: 'Accuracy', group: 'Dimension' },
  'Context awareness': { name: 'Context awareness', group: 'Dimension' },
  Completeness: { name: 'Completeness', group: 'Dimension' },
}, url: PAGE, feed: `${PAGE} (HealthBench Hard chart, overall rows)`, terms: OPENAI_TERMS,
  aliases: { 'GPT-4o (Aug 2024)': 'gpt-4o-aug-2024', 'Gemini 2.5 Pro (Mar 2025)': 'gemini-2-5-pro-mar-2025' },
  async fetch() {
    const values = chartValues(await openaiSpecs(PAGE), 'HealthBench Hard subset scores by axis');
    const rows: LeaderboardRow[] = [];
    for (const r of values.filter(r => r.theme === null)) {
      if (typeof r.model !== 'string' || typeof r.success_rate !== 'number') throw new Error('Invalid HealthBench Hard overall row');
      const name = r.model.replace(/\s+/g, ' ').trim();
      const thinking = name.endsWith(' (extended thinking)');
      const model = name === 'GPT-3.5 Turbo' ? name + ' (snapshot unspecified)' : thinking ? name.replace(' (extended thinking)', '') : name;
      const metrics: Record<string, number> = {};
      for (const axis of values.filter(a => a.model === r.model && typeof a.theme === 'string')) {
        if (typeof axis.success_rate_lower === 'number') metrics[axis.theme + ':low'] = axis.success_rate_lower * 100;
        if (typeof axis.success_rate_upper === 'number') metrics[axis.theme + ':high'] = axis.success_rate_upper * 100;
        if (typeof axis.success_rate === 'number') metrics[String(axis.theme)] = axis.success_rate * 100;
      }
      rows.push({ low: typeof r.success_rate_lower === 'number' ? r.success_rate_lower * 100 : undefined,
        high: typeof r.success_rate_upper === 'number' ? r.success_rate_upper * 100 : undefined, model, score: r.success_rate * 100, setting: thinking ? 'extended thinking' : undefined, metrics });
    }
    if (!rows.length) throw new Error('HealthBench Hard chart has no overall rows');
    return rows;
  },
};
export default board;
