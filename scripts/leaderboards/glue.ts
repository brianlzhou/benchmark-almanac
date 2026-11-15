// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/1804.07461";
const board:Leaderboard={benchmark:"glue",url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"\",\"\",\"Single Sentence\",\"Single Sentence\",\"Similarity and Paraphrase\",\"Similarity and Paraphrase\",\"Similarity and Paraphrase\",\"Natural Language Inference\",\"Natural Language Inference\",\"Natural Language Inference\",\"Natural Language Inference\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 let setting='';for(const c of t.slice(2)){if(!/^[\d.]+$/.test(c[1])){setting=c[0];continue;}out.push({model:c[0].startsWith('+')?'BiLSTM '+c[0]:c[0],setting,score:Number(c[1])});}
 return checked(out,3);
 }};export default board;
