// LongPuzzleBench tests GUI agents on long-horizon visual puzzle objectives across six games.
// Table 2 reports every agent in two settings: Native GUI Actions (coordinate GUI input only) and Code Execution
// CUA (the agent may also write and run code). The ten general-purpose models run in the Codex scaffold in both
// settings. The four GUI-specialized models run with Native GUI Actions in the authors' own harness, which exposes
// the same actions in each model's output format, so they count as the models on their own. The primary metric
// is the objective success rate (OSR). The first version of this importer looked for a header cell "OSR", but the
// paper's cells read "OSR \uparrow", so it never found the table (fixed 2026-11-23).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2609.34769';
// the table's columns after Agent, by the key each is stored under
const COLUMNS = ['osr', 'lc', 'fgp', 'lpr', 'h50', 'lcHard', 'per', 'ngar'] as const;
const board: Leaderboard = {
  benchmark: 'longpuzzlebench',
  static: 'paper',
  url: feed,
  feed,
  terms: 'The authors publish the benchmark results on arXiv. https://arxiv.org/abs/2609.34769',
  harnesses: 'system',
  // the paper drops the V from DeepSeek V4.1 Flash
  aliases: { 'DeepSeek 4.1 Flash': 'deepseek-v4-1-flash' },
  stats: {
    lc: { name: 'Level completion', unit: '%', better: 'higher', note: 'The share of target levels solved.' },
    fgp: { name: 'Fine-grained progress', unit: '%', better: 'higher', note: 'Level completion that also credits the largest fraction of the goal reached on the level where an episode stops.' },
    lpr: { name: 'Level pass rate', unit: '%', better: 'higher', note: 'The share of reached levels solved.' },
    h50: { name: '50% level horizon', unit: 'count', better: 'higher', note: 'Consecutive levels that at least half of the episodes clear on the ten-level objectives. "10+" is stored as 10.' },
    lcHard: { name: 'Level completion on hard tiers', unit: '%', better: 'higher', note: 'Level completion on the tiers above each game’s easiest.' },
    per: { name: 'Premature exit rate', unit: '%', better: 'lower', note: 'The share of episodes the agent abandons.' },
    ngar: { name: 'Native GUI action ratio', unit: '%', note: 'Under Code Execution CUA, the share of steps that are only screen observation or native GUI input.' },
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t.some(row => row[1]?.startsWith('OSR')) && t.some(row => row[0] === 'GPT-6-Astra'));
    if (!table) throw new Error('Missing LongPuzzleBench main-results table');
    const headerIndex = table.findIndex(row => row[1]?.startsWith('OSR'));
    if (table[headerIndex].slice(1).map(c => c.split(' ')[0]).join(' ') !== 'OSR LC FGP LPR H LC PER NGAR')
      throw new Error('LongPuzzleBench Table 2 columns changed: ' + table[headerIndex].join(' | '));
    const rows: LeaderboardRow[] = [];
    let section = '';
    for (const row of table.slice(headerIndex + 1)) {
      // a section heading fills every cell of its row: "Native GUI Actions general-purpose, Codex"
      if (row.every(c => c === row[0])) { section = row[0]; continue; }
      const model = row[0]?.replace(/\s*⋄$/, '').trim();
      if (!model || model === 'Human reference') continue;
      const setting = section.startsWith('Code Execution CUA') ? 'code execution' : 'native GUI actions';
      const harness = /\bCodex$/.test(section) ? 'Codex' : undefined;
      const values = Object.fromEntries(COLUMNS.map((key, i) => {
        const cell = row[i + 1]?.trim();
        if (!cell || cell === '–') return [key, NaN];
        return [key, cell === '10+' ? 10 : numberCell(cell)];
      }));
      const { osr, ...metrics } = values;
      rows.push({ model, setting, ...(harness ? { harness } : {}), score: osr, open: /⋄$/.test(row[0]), metrics });
    }
    return checked(rows, 20);
  },
};

export default board;
