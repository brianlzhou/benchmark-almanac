// Macro-JA and its 95% interval, task-family accuracies and retrieval diagnostics.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2609.34492";
const board:Leaderboard={benchmark:"powerbench", static: 'paper',parts:{trr:'TRR',crr:'CRR',corr:'CoRR'}, url:URL,feed:URL,terms:PAPER_TERMS,
 stats: { fieldAccuracy: { name: 'Field accuracy', unit: '%', better: 'higher' }, trrFieldAccuracy: { name: 'Temporal retrieval and reasoning field accuracy', unit: '%', better: 'higher' }, crrFieldAccuracy: { name: 'Contextual retrieval and reasoning field accuracy', unit: '%', better: 'higher' }, corrFieldAccuracy: { name: 'Comparative retrieval and reasoning field accuracy', unit: '%', better: 'higher' }, trrRER: { name: 'Temporal retrieval error rate', unit: '%', better: 'lower' }, trrAER: { name: 'Temporal answer error rate', unit: '%', better: 'lower' }, trrVS: { name: 'Temporal variance score', unit: '%', better: 'higher' }, trrTR: { name: 'Temporal transfer rate', unit: '%', better: 'higher' }, trrTE: { name: 'Temporal transfer efficiency', unit: '%', better: 'higher' }, crrRER: { name: 'Contextual retrieval error rate', unit: '%', better: 'lower' }, crrAER: { name: 'Contextual answer error rate', unit: '%', better: 'lower' }, crrVS: { name: 'Contextual variance score', unit: '%', better: 'higher' }, crrTR: { name: 'Contextual transfer rate', unit: '%', better: 'higher' }, crrTE: { name: 'Contextual transfer efficiency', unit: '%', better: 'higher' }, corrRER: { name: 'Comparative retrieval error rate', unit: '%', better: 'lower' }, corrAER: { name: 'Comparative answer error rate', unit: '%', better: 'lower' }, corrVS: { name: 'Comparative variance score', unit: '%', better: 'higher' }, corrTR: { name: 'Comparative transfer rate', unit: '%', better: 'higher' }, corrTE: { name: 'Comparative transfer efficiency', unit: '%', better: 'higher' } },
 async fetch(){const tables=paperTables(await paperHtml(URL)).map(grid);const diag=tables.find(t=>t[1]?.[1]==='RER');const t=tables.find(t=>t[0]?.[7]==='Overall' && t[1]?.[7]?.startsWith('Macro-JA'));if(!t)throw new Error('Reviewed result table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2)){if(!/^\d/.test(c[7]??''))continue;const interval=c[7].match(/\[([\d.]+),\s*([\d.]+)\]/);
 const metrics:Record<string,number>={fieldAccuracy:parseFloat(c[8])};
 const detail=diag?.find(r=>r[0]===c[0]);
 for(const [i,key] of ['trr','crr','corr'].entries()){
   metrics[key]=Number(c[1+2*i]);metrics[key+'FieldAccuracy']=Number(c[2+2*i]);
   if(detail && diag) for(let j=0;j<5;j++){
     const col=1+5*i+j;const value=parseFloat(detail[col]);
     if(Number.isFinite(value))metrics[key+diag[1][col]]=value;
   }
 }
 out.push({model:c[0],score:parseFloat(c[7]),low:interval?Number(interval[1]):undefined,high:interval?Number(interval[2]):undefined,setting:'50 tool calls; 300 s',metrics});}return checked(out,3);
 }};export default board;
