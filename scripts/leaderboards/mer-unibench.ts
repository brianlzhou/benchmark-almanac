// Maker's whole-benchmark aggregate. Auxiliary metrics are not separate rows.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2501.16566";
const board:Leaderboard={benchmark:'mer-unibench',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"\",\"Modality\",\"Modality\",\"Modality\",\"Basic\",\"Basic\",\"Basic\",\"Basic\",\"Sentiment\",\"Sentiment\",\"Sentiment\",\"Sentiment\",\"Fine-grained\",\"Mean\"]");if(!t)throw new Error('Reviewed table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2))out.push({model:c[0],score:Number(c[13]),setting:['audio','video','text'].filter((_,i)=>c[i+1]==='\\surd').join('+'),metrics:Object.fromEntries(t[1].slice(4,13).map((k,i)=>[k,Number(c[i+4])]))});return checked(out,3);
 }};export default board;
