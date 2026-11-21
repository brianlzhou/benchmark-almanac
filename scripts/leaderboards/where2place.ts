// Where2Place scores points inside a placement mask. Table 2 gives average accuracy and standard deviation over three runs, with a separate held-out relation subset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2406.10721';

const board: Leaderboard = {
  benchmark: 'where2place', static: 'paper',
  url: 'https://arxiv.org/abs/2406.10721',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const t = tables.find(t => t.some(r => r[0] === 'Where2Place') && t.some(r => r[0] === 'Where2Place (h)'));
    if (!t || t[0].length < 7) throw new Error('Missing Where2Place comparison');
    const whole = t.find(r => r[0] === 'Where2Place')!, held = t.find(r => r[0] === 'Where2Place (h)')!;
    const parse = (v: string) => {
      const m = v.match(/^(?:\\bf\s+)?(\d+(?:\.\d+)?)\\pm\s*(\d+(?:\.\d+)?)$/);
      if (!m) throw new Error('Invalid Where2Place accuracy');
      return [Number(m[1]), Number(m[2])];
    };
    board.parts = { heldOut: 'Where2Place (h)' };
    return t[0].slice(1).map((label, i) => {
      const name = label.replace(/\s*\[\s*\d+\s*\]/, '');
      const [score, sd] = parse(whole[i+1]), [heldOut, heldOutSd] = parse(held[i+1]);
      return { model: name.replace(/-ICL$/, ''), setting: name.endsWith('-ICL') ? 'ICL' : undefined, score, trials: 3, metrics: { std: sd, heldOut, heldOutSd } };
    });
  },
};
export default board;
