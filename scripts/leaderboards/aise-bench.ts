// AISE-Bench tests academic question answering with knowledge graph tools.
// The project leaderboard reports F1-LM, the harmonic mean of answer correctness and completeness.
// Section 4.1 names Gemini-3-Pro as the model for the six API and coding agent harnesses.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://aise-bench.github.io/';
const labels = ['Precision', 'Recall', 'Format', 'Edit Dist.', 'Para. Acc.', 'Success', 'Correct.', 'Complete.', 'Faithful.', 'F1-LM'];
const names = ['Reference precision', 'Reference recall', 'Format', 'Planning graph edit distance',
  'Parameter accuracy', 'Execution success rate', 'Correctness', 'Completeness', 'Faithfulness'];
const board: Leaderboard = {
  benchmark: 'aise-bench', url: feed, feed,
  terms: 'The project site credits its template under CC BY-SA 4.0 at https://aise-bench.github.io/.',
  aliases: { 'Claude-4.5': 'claude-sonnet-4-5', 'Deepseek-V3.2': 'deepseek-v3-2' },
  headline: 'F1-LM combines answer correctness and completeness.',
  stats: Object.fromEntries(names.map((name, i) => [name, { name, unit: 'score', better: i === 3 ? 'lower' : 'higher' }])),
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.some(c => c.text === 'API-based Judge'));
    if (!table || JSON.stringify(table[1].map(c => c.text)) !== JSON.stringify(labels)) throw new Error('AISE leaderboard columns changed');
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const cells of table.slice(2)) {
      group = cells[0].text || group;
      if (group === 'Deep Research Agent') continue;
      const name = text(cells[1].html.split(/<p\b/i)[0]);
      const caw = group === 'CAW';
      if (!caw && !['ReAct', 'AvaTaR', 'DRAFT', 'PLAY2PROMPT', 'CodeAct', 'SoAy'].includes(name)) throw new Error('Unknown agent model');
      rows.push({ model: caw ? name : 'Gemini-3-Pro', harness: caw ? group : name,
        score: numberCell(cells[11].text),
        metrics: Object.fromEntries(names.map((key, i) => [key, numberCell(cells[i + 2].text)])),
      });
    }
    return checked(rows, 12);
  },
};
export default board;
