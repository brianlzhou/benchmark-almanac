// GSM-Symbolic measures accuracy across 50 sets of generated word problems. Table 1 reports eight-shot accuracy, standard deviations and four difficulty variants.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2410.05229';

const board: Leaderboard = {
  benchmark: 'gsm-symbolic', static: 'paper',
  url: 'https://arxiv.org/abs/2410.05229',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Phi-3.5-mini-instruct": "phi-3-5-mini"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const t = tables.find(t => t[0]?.join('|') === 'Model|GSM8K (Full)|GSM8K (100)|Symbolic-M1|Symbolic|Symbolic-P1|Symbolic-P2|Symbolic-NoOp');
    if (!t || t.length < 26) throw new Error('Incomplete GSM-Symbolic comparison');
    board.parts = { m1: 'Symbolic-M1', p1: 'Symbolic-P1', p2: 'Symbolic-P2', noop: 'Symbolic-NoOp' };
    return t.slice(1).map(c => {
      const metrics: Record<string, number> = { gsm8kFull: Number(c[1]), gsm8k100: Number(c[2]) };
      const keys = ['m1','symbolic','p1','p2','noop'];
      for (const [i, key] of keys.entries()) {
        const m = c[i+3].match(/^(\d+(?:\.\d+)?)\s*\(\\pm\s*(\d+(?:\.\d+)?)\)$/);
        if (!m) throw new Error('Invalid GSM-Symbolic result: ' + c[i+3]);
        metrics[key] = Number(m[1]);
        metrics[key+'Sd'] = Number(m[2]);
      }
      const score = metrics.symbolic;
      delete metrics.symbolic;
      return { model: c[0], setting: '8-shot CoT', score, trials: 50, metrics };
    });
  },
};
export default board;
