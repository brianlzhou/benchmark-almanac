// Maker-published paper results. Keep diagnostic scores in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2107.09609';
export default {
 benchmark:'qvhighlights', static: 'paper',url:'https://arxiv.org/abs/2107.09609',feed,terms:PAPER_TERMS,
 stats: { r1IoU07: { name: 'Recall at one IoU 0.7', unit: '%', better: 'higher' }, mapIoU05: { name: 'Mean average precision at IoU 0.5', unit: '%', better: 'higher' }, mapIoU075: { name: 'Mean average precision at IoU 0.75', unit: '%', better: 'higher' }, mapAverage: { name: 'Mean average precision', unit: '%', better: 'higher' }, highlightMap: { name: 'Highlight mean average precision', unit: '%', better: 'higher' }, highlightHit1: { name: 'Highlight hit at one', unit: '%', better: 'higher' } },
 async fetch():Promise<LeaderboardRow[]> {
  const ts=flatPaperTables(await paperHtml(feed)).map(grid);
  const t=ts.find(t=>t[0]?.[1]==='Moment Retrieval' && t[2]?.[1]==='@0.5');
  if(!t)throw new Error('QVHighlights test results missing');
  const keys=['r1IoU07','mapIoU05','mapIoU075','mapAverage','highlightMap','highlightHit1'];
  return checked(t.slice(3).flatMap(r=>{
   const score=num(r[1]);if(score===undefined)return [];
   const metrics:Record<string,number>={};
   keys.forEach((k,i)=>{const n=num(r[i+2]);if(n!==undefined)metrics[k]=n;const sd=num(r[i+2]?.split('\\pm')[1]);if(sd!==undefined)metrics[k+'Stddev']=sd;});
   const sd=num(r[1].split('\\pm')[1]);if(sd!==undefined)metrics.std=sd;
   return [{model:r[0].replace(' w/ PT',''),score,trials:r[0].startsWith('Moment-DETR')?5:undefined,setting:r[0].includes('w/ PT')?'HowTo100M pretraining':'paper default',metrics}];
  }),3);
 },
} satisfies Leaderboard;
