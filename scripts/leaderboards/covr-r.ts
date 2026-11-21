// CoVR-R tests retrieval of videos that reflect the consequences of a requested change.
// Tables 1, 3 and 5 give recall at rank one, additional recall cutoffs and reasoning scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2603.20190';
const board: Leaderboard = {
  benchmark: 'covr-r', static: 'paper', feed, url: feed,
  terms: 'The authors publish the evaluation under the terms listed at https://arxiv.org/abs/2603.20190.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.slice(4).join('|') === 'Backbone|Frames|R@1|R@5|R@10|R@50|score');
    const scaling = tables.find(t => t[1]?.[0] === 'Qwen3-VL-4B' && t[0][5] === 'Reasoning Score');
    const refinement = tables.find(t => t[0]?.[5] === 'Reasoning Score' && t.some(c => c[0] === '+ Iterative Refinement'));
    if (!main || !scaling || !refinement) throw new Error('Missing CoVR-R results');
    const rows: LeaderboardRow[] = [];
    function add(model: string, setting: string, values: string[]) {
      const [r1,r5,r10,r50] = values.slice(0,4).map(numberCell);
      const [reasoningScore,reasoningSE] = values[4].split(/\s*(?:\\pm|±)\s*/).map(numberCell);
      if (reasoningSE === undefined) throw new Error('Missing reasoning score uncertainty');
      rows.push({model, setting, score:r1, metrics:{recallAt5:r5, recallAt10:r10, recallAt50:r50, reasoningScore, reasoningSE}});
    }
    for (const c of main.slice(2)) {
      const ours = c[1].startsWith('Our Approach');
      const model = ours ? 'Qwen3-VL-8B' : c[1].split(' [')[0].replace(' †','');
      const setting = ours ? (c[1].endsWith('+R') ? 'With reasoning' : 'Without explicit reasoning') :
        [c[3] + ' fusion', c[2] === '✔' ? 'with captions' : 'without captions', c[5] + ' frames'].join(', ');
      add(model, setting, c.slice(6));
    }
    for (const c of scaling.slice(1)) if (c[0] !== 'Qwen3-VL-8B') add(c[0], 'With reasoning', c.slice(1));
    add('Qwen3-VL-8B', 'Iterative refinement', refinement.find(c => c[0] === '+ Iterative Refinement')!.slice(1));
    return checked(rows,15);
  },
};
export default board;
