// BenGER tests subsumption-based legal reasoning in German law. Table 1 reports judge scores from 0 to 100.
// "Systems are ranked by the mean of their available per-corpus raw scores." Table 10 identifies the models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.28183v4';
const parts = { benchathon: 'Benchathon', zjs: 'ZJS', doctrinal: 'Doctrinal Principles' };
const board: Leaderboard = {
  benchmark: 'benger', url: feed, feed, parts,
  terms: 'The BenGER dataset uses CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  aliases: { 'Qwen3-235B-A22B-Thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.[1] === 'Benchathon' && t[1]?.join('|') === 'System / Group|n|Raw|Pass|n|Raw|Pass|n|Raw|Pass|Acc.');
    const roster = tables.find(t => t[0]?.slice(0, 3).join('|') === 'Provider|Alias|System');
    if (!table || !roster) throw new Error('Missing BenGER results or model identities');
    const names = new Map(roster.slice(1).map(row => [row[1], row[2]]));
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      if (['Human (all)', 'traditional', 'co-creation'].includes(row[0])) continue;
      const model = names.get(row[0]);
      if (!model) throw new Error('Unknown BenGER system ' + row[0]);
      const metrics: Record<string, number> = {};
      const scores: number[] = [];
      Object.keys(parts).forEach((part, index) => {
        const start = 1 + 3 * index;
        const raw = row[start + 1]?.match(/^(\d+(?:\.\d+)?) \\pm (\d+(?:\.\d+)?)$/);
        if (!raw || !/^\d+$/.test(row[start]) || !/^\d+%$/.test(row[start + 2])) throw new Error('Unexpected BenGER corpus columns for ' + model);
        const score = Number(raw[1]);
        scores.push(score);
        metrics[part] = score;
        metrics[part + 'CIHalfWidth'] = Number(raw[2]);
        metrics[part + 'Count'] = Number(row[start]);
        metrics[part + 'PassRate'] = parseInt(row[start + 2], 10);
      });
      if (!/^\d+%$/.test(row[10])) throw new Error('Missing decision accuracy');
      metrics.doctrinalDecisionAccuracy = parseInt(row[10], 10);
      rows.push({ model, score: scores.reduce((sum, value) => sum + value, 0) / scores.length, metrics });
    }
    return checked(rows, 12);
  },
};
export default board;
