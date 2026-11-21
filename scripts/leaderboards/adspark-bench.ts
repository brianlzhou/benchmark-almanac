// The source reports no overall score. The headline is the plain mean of the 18 parts, computed by this importer.
// AdSpark-Bench evaluates advertising videos. Table 3 reports normalized scores on 18 submetrics
// grouped under six dimensions. Models without an audio score cannot enter the complete-case mean.
import type { Leaderboard, BoardPart } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://arxiv.org/html/2610.10047';
const labels = ['Aes.','Img.','Subj.','Reg.','Text','X-shot','Struct.','Exec.','Content','Gme','Motion','Trans.','Temp.','BG Audio','Script','Attr.','Creat.','Narr.'];
const parts:Record<string,BoardPart> = {};
const board:Leaderboard = {
  benchmark:'adspark-bench',static:'paper',url,feed:url,terms:PAPER_TERMS,parts,
  aliases:{'Seedance 2.0':'dreamina-seedance-2-0'},
  headline:'The paper gives no overall score, so this is the plain mean of its 18 normalized submetric scores.',
  async fetch() {
    const table=paperTables(await paperHtml(url)).map(grid).find(t=>t[1]?.join('|')===['Method',...labels].join('|'));
    if (!table) throw new Error('Missing Table 3 submetrics');
    const rows=table.slice(2).flatMap(([model,...cells])=>{
      if (cells.length!==labels.length) throw new Error('Missing columns for '+model);
      if (cells.includes('–')) return [];
      const metrics:Record<string,number>={};
      cells.forEach((v,i)=>{
        if (!/^\d+(?:\.\d+)?$/.test(v)) throw new Error('Invalid submetric');
        const key=labels[i].replace(/[^a-z0-9]/gi,'');
        parts[key]={name:labels[i],group:table[0][i+1],unit:'score'};
        metrics[key]=Number(v);
      });
      return [{model,metrics,score:Object.values(metrics).reduce((a,b)=>a+b,0)/labels.length}];
    });
    return checked(rows,7);
  },
};
export default board;
