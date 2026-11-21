// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// HaluMem tests memory systems. Its README ranks memory extraction F1 first and gives separate Medium and Long results.
// Entries identify the memory system itself. GPT-4o judges outputs and generates answers for the separate QA task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/MemTensor/HaluMem/HEAD/README.md';
const splits = ['HaluMem-Medium','HaluMem-Long'];
const names = ['Recall','Weighted recall','Target precision','Accuracy','False memory resistance','F1','Updating correct','Updating hallucination','Updating omission','QA correct','QA hallucination','QA omission'];
const board: Leaderboard = {
  benchmark:'halumem', url:'https://github.com/MemTensor/HaluMem#-leaderboard', feed,
  terms:'CC BY-NC-ND 4.0: https://spdx.org/licenses/CC-BY-NC-ND-4.0.html',
  headline:'The leaderboard prioritizes memory extraction F1. The headline is the plain mean of F1 on HaluMem-Medium and HaluMem-Long.',
  parts:Object.fromEntries(splits.map(name=>[name,name+' F1'])),
  async fetch() {
    const readme = (await fetchText(feed)).replace(/<!--[\s\S]*?-->/g,'');
    const bySplit = splits.map(split => {
      const section = readme.split(split+' Dataset')[1]?.split('</table>')[0];
      if (!section) throw Error('Missing '+split);
      const t = paperTables(section+'</table>').map(grid)[0];
      if (t?.[1]?.join('|') !== 'System|R↑|Weighted R↑|Target P↑|Acc.↑|FMR↑|F1↑|C↑|H↓|O↓|C↑|H↓|O↓') throw Error('Changed memory system columns');
      return t.slice(2);
    });
    const rows: LeaderboardRow[] = [];
    for (const first of bySplit[0]) {
      const model = first[0];
      const pair = [first,bySplit[1].find(r=>r[0]===model)];
      if (pair.some(r => !r || r[6] === '-')) continue;
      const metrics: Record<string,number> = {};
      for (const [i,r] of pair.entries()) {
        for (const [j,name] of names.entries()) {
          const match = /^(\d+(?:\.\d+)?)%(?:\((\d+)\))?$/.exec(r![j+1]);
          if (!match) throw Error('Invalid '+name+' for '+model);
          metrics[splits[i]+' '+name] = Number(match[1]);
          if (match[2]) metrics[splits[i]+' '+name+' count'] = Number(match[2]);
        }
        metrics[splits[i]] = metrics[splits[i]+' F1'];
      }
      rows.push({model,score:(metrics[splits[0]]+metrics[splits[1]])/2,metrics});
    }
    return checked(rows,5);
  },
};
export default board;
