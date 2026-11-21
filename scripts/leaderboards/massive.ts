// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2204.08582";
const board:Leaderboard={benchmark:"massive", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,stats:{intentAccuracy:{name:'Intent accuracy',unit:'%',better:'higher'},slotF1:{name:'Slot F1',unit:'%',better:'higher'}},
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"Model\",\"Intent Acc (%)\",\"Intent Acc (%)\",\"Intent Acc (%)\",\"Slot F1 (%)\",\"Slot F1 (%)\",\"Slot F1 (%)\",\"Exact Match Acc (%)\",\"Exact Match Acc (%)\",\"Exact Match Acc (%)\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(let i=2;i<t.length;i+=2){const c=t[i];out.push({model:c[0]+' '+(c[0]==='mT5 Base'?t[i+1][0]:''),score:parseFloat(c[9]),setting:'full 51-language training',metrics:{intentAccuracy:parseFloat(c[3]),slotF1:parseFloat(c[6])}});}
 return checked(out,3);
 }};export default board;
