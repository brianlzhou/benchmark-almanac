// HumMusQA tests music understanding. Table 1 reports accuracy and consistency over four answer orderings, and Table 2 compares noise and silence inputs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2603.27877';

const board: Leaderboard = {
  benchmark: 'hummusqa', static: 'paper',
  url: 'https://arxiv.org/abs/2603.27877',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const main = tables.find(t => t[0]?.includes('Consistency (%)') && t[1]?.[1] === 'All');
    const ablation = tables.find(t => t[1]?.join('|') === 'Model|Real|Noise|Silence');
    if (!main || main.length < 9 || !ablation || ablation.length < 5) throw new Error('Missing HumMusQA tables');
    const read = (s: string) => {
      const m = s.match(/^(\d+(?:\.\d+)?) ± (\d+(?:\.\d+)?)$/);
      if (!m) throw new Error('Invalid HumMusQA accuracy');
      return [Number(m[1]), Number(m[2])];
    };
    board.parts = { low: 'Low', medium: 'Med.', high: 'High' };
    const rows: LeaderboardRow[] = main.slice(2).map(c => {
      if (c.length !== 9) throw new Error('Missing HumMusQA columns');
      const model = c[0].split(' ')[0], [score, sd] = read(c[1]);
      const metrics: Record<string, number> = { std: sd, consistency: Number(c[5]) };
      ['low','medium','high'].forEach((key,i) => {
        [metrics[key], metrics[key+'Sd']] = read(c[2+i]);
        metrics[key+'Consistency'] = Number(c[6+i]);
      });
      return { model, setting: c[0].endsWith('(text-only)') ? 'text-only' : 'Real', trials: 4, score, metrics };
    });
    for (const c of ablation.slice(2)) {
      const model = c[0] === 'musicflamingo' ? 'music-flamingo' : c[0];
      for (const i of [2,3]) {
        const [score, sd] = read(c[i]);
        rows.push({ model, setting: ablation[1][i], score, trials: 4, metrics: { std: sd } });
      }
    }
    return rows;
  },
};
export default board;
