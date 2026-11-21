// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2011.07743";
const board:Leaderboard={benchmark:"grailqa", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"\",\"Overall\",\"Overall\",\"I.I.D.\",\"I.I.D.\",\"Compositional\",\"Compositional\",\"Zero-shot\",\"Zero-shot\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 let base='';for(const c of t.slice(2)){if(c[0].startsWith('-')){out.push({model:base+' '+c[0],score:Number(c[2]),metrics:{exactMatch:Number(c[1])}});continue;}base=c[0].replace(/ \(.*\)/,'');out.push({model:base,score:Number(c[2]),metrics:c[1]==='-'?{}:{exactMatch:Number(c[1])}});}
 return checked(out,3);
 }};export default board;
