// GDPval's hosted leaderboard is retired. The official release article still supplies its chart as JSON.
// The headline is expert-graded wins plus ties, not wins alone. Both components and the interval are retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { openaiSpecs, chartValues, OPENAI_TERMS } from '../lib/boards/openai.ts';
const PAGE = 'https://openai.com/index/gdpval/';
const stats = { wins: { name: 'Wins', unit: '%', better: 'higher' as const }, ties: { name: 'Ties', unit: '%', better: 'higher' as const } };
const board: Leaderboard = {
  benchmark: 'gdpval', url: PAGE, feed: `${PAGE} (embedded GDPval wins and ties chart)`, terms: OPENAI_TERMS, stats,
  async fetch() {
    const values = chartValues(await openaiSpecs(PAGE), 'GDPval win rate: performance on economically valuable tasks');
    const rows: LeaderboardRow[] = [];
    for (const model of new Set(values.map(r => String(r.model)))) {
      const wins = values.find(r => r.model === model && r.legendGroup === 'Wins');
      const ties = values.find(r => r.model === model && r.legendGroup === 'Ties');
      if (typeof wins?.value !== 'number' || typeof ties?.value !== 'number') throw new Error(`Incomplete GDPval components: ${model}`);
      const effort = model.match(/ (low|medium|high)$/);
      let name = effort ? model.slice(0, effort.index) : model;
      if (['GPT-4o', 'Gemini 2.5 Pro'].includes(name)) name += ' (snapshot unspecified)';
      const low = typeof ties.ci_low === 'number' ? ties.ci_low : undefined;
      const high = typeof ties.ci_high === 'number' ? ties.ci_high : undefined;
      rows.push({ model: name, setting: effort?.[1], score: wins.value + ties.value,
        ...(low !== undefined && high !== undefined && low <= high ? { low, high } : {}),
        metrics: { wins: wins.value, ties: ties.value,
          ...(low !== undefined ? { ciLow: low } : {}),
          ...(high !== undefined ? { ciHigh: high } : {}),
        },
      });
    }
    return rows;
  },
};
export default board;
