// TCS-BENCH tests research-level proof generation. Tables 1 and 2 report proof accuracy and identify the two models in the Colosseum selection system.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2608.09538';
const board: Leaderboard = {
  benchmark: 'tcs-bench', url: feed, feed, static: 'paper',
  terms: 'The paper authors publish Tables 1 and 2 under the terms linked at https://arxiv.org/abs/2608.09538.',
  stats: { solved: { name: 'Problems solved', unit: 'count', better: 'higher', note: 'Number solved out of 300 problems.' } },
  aliases: { 'Opus 5': 'claude-opus-5' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0]?.[0] === 'Model' && t[0][1]?.startsWith('Accuracy'));
    const systems = tables.find(t => t[0]?.join('|') === '|Solved / 300|Accuracy');
    if (!main || !systems) throw new Error('Missing TCS-BENCH results');
    const rows: LeaderboardRow[] = [];
    for (const [label, value] of main.slice(1)) {
      if (label === 'Colosseum Cross Model') continue;
      rows.push({ model: label.replace(/ \(max\)$/, ''), setting: label.endsWith('(max)') ? 'max' : undefined, score: numberCell(value) });
    }
    const backbones = systems.slice(1).filter(r => /^Colosseum\s*,\s*Gemini/.test(r[0])).map(r => r[0].split(',')[1].trim());
    if (backbones.length !== 2) throw new Error('Colosseum backbone names changed');
    for (const [label, count, accuracy] of systems.slice(1)) {
      if (label.startsWith('Oracle')) continue;
      const blend = label.includes('cross-model selection');
      rows.push({ model: blend ? backbones[0] : label.split(',')[1].trim(), models: blend ? backbones : undefined,
        harness: blend ? 'Colosseum cross-model selection' : 'Colosseum', score: numberCell(accuracy.replace(/\\?%$/, '')), metrics: { solved: numberCell(count) } });
    }
    return checked(rows, 7);
  },
};
export default board;
