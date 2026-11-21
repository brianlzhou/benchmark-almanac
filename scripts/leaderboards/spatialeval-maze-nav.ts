// SpatialEval Maze-Nav measures route-finding accuracy. Tables 7 and 9 give combined question accuracy per input format.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2406.14852';

const board: Leaderboard = {
  benchmark: 'spatialeval-maze-nav', static: 'paper',
  url: 'https://arxiv.org/abs/2406.14852',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"LLaVA-1.6-34B": "llava-v1-6-34b", "LLaVA-1.6-Vicuna-7B": "llava-v1-6-vicuna-7b", "LLaVA-1.6-Vicuna-13B": "llava-v1-6-vicuna-13b", "GPT-4o": "gpt-4o-may-2024", "GPT-4V": "gpt-4v"},
  async fetch() {
    const html = await paperHtml(FEED);
    const tables = inlinePaperTables(html);
    const commercial = tables.find(t => t[0]?.[3] === 'Maze-Nav Acc');
    const figure = html.match(/<figure id="A6\.T9"[\s\S]*?<\/figure>/)?.[0];
    const detail = figure && inlinePaperTables(figure)[0];
    if (!commercial || !detail || detail[0].join('|') !== 'Input Format|Model Name|Q1 Acc|Q2 Acc|Q3 Acc|Avg Acc') throw new Error('Missing Maze-Nav table');
    function pct(value: string) {
      if (!/^\d+\.\d+$/.test(value)) throw new Error('Invalid accuracy');
      return Math.round(Number(value) * 10000) / 100;
    }
    board.parts = { q1: 'Q1 Acc', q2: 'Q2 Acc', q3: 'Q3 Acc' };
    const rows: LeaderboardRow[] = commercial.slice(1).map(c => ({model: c[1], setting: c[0], score: pct(c[3])}));
    for (const [setting, model, q1, q2, q3, avg] of detail.slice(1)) {
      rows.push({ model, setting, score: pct(avg), metrics: {q1: pct(q1), q2: pct(q2), q3: pct(q3)} });
    }
    if (commercial.length < 14 || detail.length < 21) throw new Error('Incomplete Maze-Nav comparison');
    return rows;
  },
};
export default board;
