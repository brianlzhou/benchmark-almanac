// Google DeepMind evaluated Gemini agents on 13 in-house CTF challenges.
// Table 7 reports the number solved at least once in ten attempts, converted here to a percentage.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { tables } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2403.13793';
const board: Leaderboard = {
  benchmark: 'gdm-in-house-ctf', static: 'paper', url: 'https://arxiv.org/abs/2403.13793', feed,
  terms: 'arXiv allows this HTML paper in robots.txt. Google DeepMind published these results.',
  aliases: { 'Pro 1.0': 'gemini-1-0-pro', 'Ultra 1.0': 'gemini-1-0-ultra' },
  async fetch() {
    const html = await paperHtml(feed);
    const figure = html.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi)?.find(f => f.includes('In-house CTF results.'));
    const table = tables(figure ?? '')[0]?.map(row => row.map(c => c.text));
    if (table?.length !== 15 || table[0].join('|') !== 'Challenge|Nano 1.0|Pro 1.0|Ultra 1.0' || table[14][0] !== 'Total')
      throw new Error('In-house CTF result table changed');
    const tasks = table.slice(1, -1);
    board.parts = Object.fromEntries(tasks.map(r => [r[0], r[0]]));
    return table[0].slice(1).map((model, i) => {
      const total = table[14][i + 1].match(/^(\d+)\/13$/);
      if (!total) throw new Error('Missing in-house CTF total');
      const metrics = Object.fromEntries(tasks.map(r => {
        if (!['✓', '✗'].includes(r[i + 1])) throw new Error('Unexpected CTF result');
        return [r[0], r[i + 1] === '✓' ? 100 : 0];
      }));
      if (Object.values(metrics).filter(Boolean).length !== Number(total[1])) throw new Error('In-house CTF totals disagree');
      return { model, score: Number(total[1]) * 100 / 13, trials: 10, metrics };
    });
  },
};
export default board;
