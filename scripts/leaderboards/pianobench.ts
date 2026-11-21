// PianoBench tests perception and reasoning on 250 questions about piano passages.
// Table 1 gives zero-shot accuracy for each input modality and reasoning setting on the same questions.
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const feed = 'https://arxiv.org/html/2611.03839';
const board: Leaderboard = {
  benchmark: 'pianobench', url: feed, feed, static: 'paper',
  terms: 'The authors publish Table 1 under the terms linked at https://arxiv.org/abs/2611.03839.',
  aliases: {'Qwen 3 Omni 30B-A3B (thinking)': 'qwen3-omni-30b-a3b-thinking',
    'Qwen 3 Omni 30B-A3B (non-thinking)': 'qwen3-omni-30b-a3b', 'Gemma 4 12B': 'gemma-4-12b-it'},
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0].join('|') === 'Model|No music|MIDI-text|MIDI-text|Piano synth|Piano synth|Piano stem|Piano stem' &&
      t[1]?.filter(c => c === 'Acc.').length === 4);
    if (!table) throw new Error('Missing PianoBench Table 1 accuracy columns');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      if (new Set(row).size === 1) continue;
      const label = row[0].replace(/\s*[∗†]$/, '').replace('Inkling{}_{small}', 'Inkling Small');
      const mode = label.match(/ \(([^()]+)\)$/);
      // Table 3 identifies separate Qwen3-Omni Thinking and Instruct checkpoints.
      const model = label.startsWith('Qwen 3 Omni') ? label : label.replace(/ \([^()]+\)$/, '');
      for (const col of [1, 2, 4, 6]) {
        if (row[col] === '-') continue;
        const setting = ['Zero-shot', table[0][col], mode?.[1]].filter(Boolean).join(', ');
        const delta = col > 1 ? row[col+1] : '-';
        rows.push({model, setting, score: numberCell(row[col]),
          ...(delta !== '-' && {metrics: {gainOverNoMusic: numberCell(delta.replace(/^\+/, ''))}})});
      }
    }
    return checked(rows, 70);
  },
};
export default board;
