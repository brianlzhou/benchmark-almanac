// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// BuildArena tests whether models can build working structures. The official leaderboard averages success over three difficulties for each task.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://build-arena.github.io/';
const parts = { transport: 'Transport', support: 'Support', lift: 'Lift' };
const board: Leaderboard = {
  benchmark: 'buildarena', url: feed + '#leaderboard', feed, parts,
  terms: 'The authors release BuildArena under CC BY-NC 4.0. https://github.com/AI4Science-WestlakeU/BuildArena/blob/main/LICENSE',
  aliases: { 'grok4-0709': 'grok-4', 'doubao-seed-1-6-250615': 'doubao-seed-1-6', 'deepseek-chat (DeepSeek-V3.1)': 'deepseek-v3-1', 'claude-sonnet-4-20250514': 'claude-sonnet-4' },
  async fetch() {
    const expected = ['Model (Full Name)', ...Object.values(parts).map(label => label + ' Avg Success Rate'), 'Overall Performance'];
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === expected.join('|'));
    if (!table) throw new Error('BuildArena leaderboard missing');
    return checked(table.slice(1).map(row => {
      const fullName = row[0]?.html.match(/<span\b[^>]*>(.*?)<\/span>/i);
      if (!fullName || row.length !== 5) throw new Error('Missing BuildArena model or columns');
      const values = row.slice(1, 4).map(cell => {
        if (!/^\d+(\.\d+)?%$/.test(cell.text)) throw new Error('Invalid success rate for ' + fullName[1]);
        return parseFloat(cell.text);
      });
      return { model: text(fullName[1]), score: values.reduce((sum, v) => sum + v, 0) / values.length,
        harness: 'Baseline agentic workflow', metrics: { transport: values[0], support: values[1], lift: values[2], samplesPerTask: 64 } };
    }), 9);
  },
};
export default board;
