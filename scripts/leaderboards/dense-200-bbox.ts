// Dense200 tests box detection in crowded images. The Rex-Omni paper leads with F1 at IoU 0.5 and also reports F1 at 0.95 and averaged over thresholds.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2510.12798';

const board: Leaderboard = {
  benchmark: 'dense-200-bbox', static: 'paper',
  stats: {
    f1At95: { name: 'F1 at IoU 0.95', unit: '%', better: 'higher' },
    meanF1: { name: 'Mean F1', unit: '%', better: 'higher' },
    outputTokensAt100: { name: 'Output tokens per image (Dense200@100)', unit: 'tokens', better: 'lower' },
    boxesPerImageAt100: { name: 'Boxes per image (Dense200@100)', unit: 'count' },
    tokensPerBoxAt100: { name: 'Output tokens per box (Dense200@100)', unit: 'tokens', better: 'lower' },
  },
  url: 'https://arxiv.org/abs/2510.12798',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const t = tables.find(t => t[0]?.[3] === 'Dense200' && t[0]?.[6] === 'VisDrone' && t[1]?.[2]?.startsWith('Score Thresh'));
    if (!t || t.length < 13 || t[1].slice(3,6).join('|') !== 'F1@IoU 0.5|F1@IoU 0.95|F1@IoU mIoU') throw new Error('Missing Dense200 detection table');
    const rows: LeaderboardRow[] = t.slice(2).map(c => {
      if (c.slice(3,6).some(s => !/^\d+(?:\.\d+)?$/.test(s))) throw new Error('Invalid Dense200 F1 score');
      return { model: c[1], score: Number(c[3]), setting: c[2] === '-' ? undefined : 'Score threshold ' + c[2], metrics: { f1At95: Number(c[4]), meanF1: Number(c[5]) } };
    });
    const usage = tables.find(t => t[0]?.[4] === 'Dense200@100' && t[1]?.[5]?.startsWith('output tokens/img'));
    if (!usage || usage.length < 4) throw new Error('Missing Dense200 token table');
    for (const c of usage.slice(2)) {
      const row = rows.find(r => r.model === c[0]);
      if (!row) throw new Error('Unknown Dense200 token row');
      row.metrics!.outputTokensAt100 = Number(c[5]);
      row.metrics!.boxesPerImageAt100 = Number(c[4]);
      row.metrics!.tokensPerBoxAt100 = Number(c[6]);
    }
    return rows;
  },
};
export default board;
