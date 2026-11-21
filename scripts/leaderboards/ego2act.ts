// Ego2Act tests whether generated first-person videos complete a physical task plausibly.
// The project leaderboard reports the average per-video geometric mean of Task and Physics.
// The headline uses Ego2ActJudge on all cases. Human ratings cover a separate 25-case panel.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ego2act.github.io/';
const parts = { humanTask:'Human Task', humanPhysics:'Human Physics', humanFinal:'Human Final',
  task:'Ego2ActJudge Task', physics:'Ego2ActJudge Physics' };
const board: Leaderboard = {
  benchmark:'ego2act', url:feed, feed, parts, terms:'The benchmark data use CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  aliases: { 'Grok-1.5':'grok-imagine-video-1-5', 'Seedance-2.0':'dreamina-seedance-2-0','Cosmos-3 Nano':'cosmos3-nano' },
  async fetch() {
    const table = tables(await fetchText(feed)).map(grid).find(t => t[0].includes('Ego2ActJudge (Full cases)'));
    if (!table?.[0].includes('Human raters (25-case panel)') || table[1].join('|') !== 'Task|Physics|Final|Task|Physics|Final') throw Error('Missing generator leaderboard columns');
    const rows = table.slice(2).filter(r => !r[0].startsWith('Human (')).map(([model,...cells]) => {
      if (cells.length !== 6 || cells.some(v => !v || !Number.isFinite(Number(v)))) throw Error('Invalid scores for ' + model);
      const metrics = Object.fromEntries(Object.keys(parts).map((key,i) => [key,Number(cells[i])]));
      return { model, score:Number(cells[5]), metrics, trials:3 };
    });
    return checked(rows, 6);
  },
};
export default board;
