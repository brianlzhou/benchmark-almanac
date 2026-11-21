// ViSpeak-Bench measures timely and accurate responses to visual instructions. Table 6 gives Overall on a five-point scale, converted to percent of maximum for the catalog.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2503.12769';

const board: Leaderboard = {
  benchmark: 'vispeak-bench', static: 'paper',
  url: 'https://arxiv.org/abs/2503.12769',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"InternVL-2.5": "internvl2-5-8b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const t = tables.find(t => t[0]?.includes('Time Accuracy (%)') && t[0].includes('Text Score') && t[1]?.at(-1) === 'Overall');
    if (!t || t[1].length !== 21) throw new Error('Missing ViSpeak comparison');
    board.parts = {};
    const rows: LeaderboardRow[] = [];
    for (const c of t.slice(2)) {
      if (c.every(v => v === c[0]) || c[0].startsWith('Human')) continue;
      const name = c[0].replace(/\s*\[\s*\d+\s*\]/, '');
      const model = name === 'Qwen2.5-VL' ? name + '-' + c[1] : name;
      const metrics: Record<string, number> = {};
      for (let i = 5; i < 20; i++) {
        const time = t[0][i] === 'Time Accuracy (%)';
        const key = (time ? 'time' : 'text') + t[1][i];
        if (c[i] === '-') continue;
        if (!/^\d+(?:\.\d+)?$/.test(c[i])) throw new Error('Invalid ViSpeak subscore');
        metrics[key] = Number(c[i]);
        if (t[1][i] !== 'All') board.parts[key] = { name: t[1][i], group: t[0][i], unit: time ? '%' : 'score', ...(time ? {} : { note: 'On a five-point scale' }) };
      }
      if (!/^\d+(?:\.\d+)?$/.test(c[20])) throw new Error('Invalid ViSpeak overall');
      rows.push({ model, score: Math.round(Number(c[20])*2000)/100, metrics, ...(c[1] !== '-' ? { params: Number(c[1].replace('B','')), setting: 'Frames: ' + c[2] } : {}) });
    }
    if (rows.length < 10) throw new Error('Incomplete ViSpeak results');
    return rows;
  },
};
export default board;
