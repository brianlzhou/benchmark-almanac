// TaskBench evaluates tool selection, task decomposition and parameter prediction for tool-augmented LLMs.
// The paper's Table 3 reports overall node and edge F1 for three tool collections.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { tables, num } from '../lib/html.ts';
const FEED = 'https://arxiv.org/html/2311.18760';
const board: Leaderboard = { benchmark: 'taskbench', static: 'paper', url: FEED, feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt. Results are attributed to the paper authors.',
  parts: { nodeF1: { name: 'Node F1', group: 'Tool selection' }, edgeF1: { name: 'Edge F1', group: 'Tool selection' } },
  async fetch() {
    const ts = tables(await paperHtml(FEED));
    const table = ts.find(t => t[0]?.[0]?.text.includes('Tool Selection') && t[1]?.[0]?.text === 'LLM');
    if (!table) throw new Error('Missing TaskBench tool selection table');
    const rows: LeaderboardRow[] = []; let group = '';
    for (const r of table.slice(2)) {
      const first = r[0]?.text.trim() ?? ''; const second = r[1]?.text.trim() ?? '';
      if (/^(Hugging Face Tools|Multimedia Tools|Daily Life APIs)$/.test(first)) { group = first; continue; }
      if (!group || !second) continue;
      const values = [num(r[8]?.text ?? ''), num(r[9]?.text ?? '')];
      if (!values.every(v => v !== undefined)) continue;
      rows.push({ model: second, setting: group, score: values[0] as number, metrics: { edgeF1: values[1] as number } });
    }
    if (rows.length < 2) throw new Error('TaskBench table yielded too few model rows');
    return rows;
  },
};
export default board;
