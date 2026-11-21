// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// FunGraph3D tests node and relationship retrieval in indoor scans. Tables 1 and 2 report overall recall at 10 for each task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2503.19199';
const tasks = ['Objects','Inter. Elements','Overall Nodes','Node Assoc.','Edge Pred.','Overall Triplets'];
const parts = tasks.flatMap((task,i) => [task + (i < 3 ? ' R@3' : ' R@5'),task + ' R@10']);
const board: Leaderboard = {
  benchmark: 'fungraph3d', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2503.19199",
  parts:Object.fromEntries(parts.map(name => [name,{name,unit:'%' as const}])),
  headline:'The paper reports separate overall node and triplet recall at 10, so this is their plain mean.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const read = (overall:string,k:string) => {
      const table = tables.find(t => t[1]?.[12] === overall && t[0]?.[8] === 'FunGraph3D (Ours)');
      if (!table || table[2].slice(8).join('|') !== [k,'R@10',k,'R@10',k,'R@10'].join('|')) throw new Error('Missing FunGraph3D recall columns');
      return new Map(table.slice(3).map(r => [r[0],r.slice(8).map(numberCell)]));
    };
    const nodes = read('Overall Nodes','R@3');
    const triplets = read('Overall Triplets','R@5');
    const rows:LeaderboardRow[] = [];
    for (const [label,node] of nodes) {
      const triple = triplets.get(label);
      if (!triple || node.length !== 6 || triple.length !== 6) throw new Error('Incomplete FunGraph3D method');
      const model = label.split(/[*(]/)[0].trim();
      const setting = label.includes('†') ? 'Adapted prompt with fused 3D nodes' : label.includes('IED') ? 'Adapted prompt with interactive element detection' : label.includes('*') ? 'Adapted prompt' : undefined;
      const values = [...node,...triple];
      rows.push({model,setting,score:(node[5]+triple[5])/2,metrics:Object.fromEntries(parts.map((k,i) => [k,values[i]]))});
    }
    return checked(rows,5);
  },
};
export default board;
