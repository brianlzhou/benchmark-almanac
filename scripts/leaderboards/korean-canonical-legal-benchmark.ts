// KCL tests Korean legal question answering and essay evaluation. Table 2 reports each model's KCL-MCQA score
// without context and then with the supporting precedents, as the mean ± standard deviation of three runs.
// The headline is the score with precedents, which is what the benchmark is built to measure. The score without
// them is a labeled measure. The first version of this importer searched the page text with double-escaped
// patterns and never matched (fixed 2026-11-23).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2512.24572';
// "47.9_{\pm 1.0}\rightarrow 72.0_{\pm 0.4}", sometimes wrapped in \mathbf{...}
const cell = /^(\d+(?:\.\d+)?)_\{\\pm (\d+(?:\.\d+)?)\}\}?\\rightarrow\s*(?:\\mathbf\{)?(\d+(?:\.\d+)?)_\{\\pm (\d+(?:\.\d+)?)\}/;
const board: Leaderboard = {
  benchmark: 'korean-canonical-legal-benchmark', url: feed, feed, static: 'paper',
  terms: 'The authors publish the paper on arXiv. ' + feed.replace('/html/', '/abs/'),
  stats: {
    vanilla: { name: 'Score without precedents', unit: '%', better: 'higher', note: 'The same questions with no supporting precedents in the prompt.' },
  },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[0] === 'KCL-MCQA' && t[1]?.[1] === 'Model Name');
    if (!table) throw new Error('Missing KCL-MCQA Table 2');
    const rows: LeaderboardRow[] = [];
    for (const [type, name, value] of table.slice(2)) {
      if (!name || name === 'Average' || type === 'Random') continue;
      const m = value?.replace(/^\\mathbf\{/, '').match(cell);
      if (!m) throw new Error(`Unexpected KCL cell for ${name}: ${value}`);
      // the caption: "Precedents exceeding the maximum context length were truncated (indicated by *)"
      const truncated = /\s*\*$/.test(name);
      rows.push({ model: name.replace(/\s*\*$/, ''), ...(truncated ? { setting: 'truncated precedents' } : {}), score: Number(m[3]), trials: 3, metrics: { vanilla: Number(m[1]), std: Number(m[4]) } });
    }
    return checked(rows, 30);
  },
};
export default board;
