// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2607.16165";
const board:Leaderboard={benchmark:"activevision", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,aliases:{},
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"Track\",\"Accuracy (%)\",\"Time/item (min)\",\"API cost/item ($)\",\"Tool calls per item\",\"Output tokens per item\",\"Agent turns per item\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1)){if(c[0].startsWith('Human'))continue;const m=c[0].match(/^(.+) \((.+)\)$/);if(!m)throw new Error('Agent track identity changed');out.push({model:m[2].startsWith('GPT')?m[2]:'Claude '+m[2],harness:m[1],score:parseFloat(c[1]),setting:'85 items; tools enabled',metrics:{minutesPerItem:parseFloat(c[2]),costPerItem:parseFloat(c[3])}});}
 return checked(out,3);
 }};export default board;
