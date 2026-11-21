// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2301.00876";
const board:Leaderboard={benchmark:"maud", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"Deal Point Category\",\"Random\",\"BERT\",\"RoBERTa\",\"LegalBERT\",\"DeBERTa\",\"BigBird\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const [i,table] of ts.filter(t=>t[0]?.[0]==='Deal Point Category'&&t[0]?.[1]==='Random').entries()){const c=table.find(c=>c[0]==='Overall');if(!c)throw new Error('Overall row missing');for(let j=2;j<table[0].length;j++)out.push({model:table[0][j]+' (MAUD fine-tuned)',score:Number(c[j].replace('%','')),setting:i===0?'single-task':'multi-task'});}
 return checked(out,3);
 }};export default board;
