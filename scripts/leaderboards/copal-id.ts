// COPAL-ID tests causal reasoning on Indonesian cultural scenarios. Table 4 reports accuracy
// on the same questions under different language and training settings. For open prompted
// models, each cell gives the best result across the tested prompt configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2311.01012';
const board: Leaderboard = {
  benchmark: 'copal-id', feed, url: feed, static: 'paper',
  terms: 'The authors release COPAL-ID under CC BY-SA 4.0. https://github.com/haryoa/copal-id',
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.[1] === 'XCOPA-ID' && t[0][4] === 'Translate-test');
    if (!t || t[2].slice(2).join('|') !== '(standard)|(colloquial)|(translated)|(standard)') throw new Error('Missing COPAL-ID evaluations');
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const c of t.slice(3)) {
      if (!c[2]) {group = c[0]; continue;}
      if (c[0] === 'Human') continue;
      const model = c[0].replace(/ \(5-shot\)$/, '');
      const training = group === 'Finetuned models' ? 'Fine-tuned' : group === 'Closed models prompting' ? '5-shot' : '5-shot, best prompt';
      for (const [i, protocol] of ['Monolingual standard', 'Monolingual colloquial', 'Translate-test', 'Cross-lingual standard'].entries()) {
        if (c[i+2] !== '-') rows.push({model, setting: training + ', ' + protocol, score: numberCell(c[i+2])});
      }
    }
    return checked(rows, 42);
  },
};
export default board;
