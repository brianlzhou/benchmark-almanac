// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// DeskCraft tests desktop workflows. Table 2 reports separate task-level success rates
// for Standard and Interactive tasks, with application-specific rates in both splits.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2606.03103';
const board: Leaderboard = {
  benchmark:'deskcraft', feed, url:feed, static:'paper',
  headline:'The paper reports success separately for Standard and Interactive tasks, so the headline is the plain mean of the two rates.',
  terms:'The authors publish these results under the terms linked at https://arxiv.org/abs/2606.03103.',
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t=>t[0]?.[1] === 'Standard (386 tasks)' && t[0][15] === 'Interactive (152 tasks)');
    if (!t || t[1][14] !== 'Avg.' || t[1][28] !== 'Avg.' || t[1].slice(1,15).join('|') !== t[1].slice(15).join('|')) throw new Error('Missing DeskCraft split averages');
    const parts: NonNullable<Leaderboard['parts']> = {standard:'Standard', interactive:'Interactive'};
    for (const label of ['Standard','Interactive']) for (const app of t[1].slice(1,14)) parts[label+' '+app] = {name:app,group:label};
    board.parts = parts;
    return checked(t.slice(2).filter(c=>c[0] !== c[1]).map(c=>{
      const standard = numberCell(c[14]), interactive = numberCell(c[28]);
      const metrics: Record<string,number> = {standard,interactive};
      for (const [i,label] of ['Standard','Interactive'].entries()) {
        for (const [j,app] of t[1].slice(1,14).entries()) {
          const cell = c[1 + 14*i+j];
          if (!['','–','—','-'].includes(cell)) metrics[label+' '+app] = numberCell(cell);
        }
      }
      return {model:c[0], score:(standard+interactive)/2, metrics};
    }),18);
  },
};
export default board;
