// Maker's whole-benchmark aggregate. Auxiliary metrics are not separate rows.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2007.15207.pdf";
const board:Leaderboard={benchmark:'mkqa',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"Retriever\",\"Reader\",\"Translation\",\"Translation\",\"Retrieval Metrics\",\"Answerable Metrics\",\"Answerable Metrics\",\"End-to-End Metrics\",\"End-to-End Metrics\"]");if(!t)throw new Error('Reviewed table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2)){if(!['Elasticsearch*','DPR','Query-only'].includes(c[0]))continue;out.push({model:c[1]+' (MKQA fine-tuned)',harness:c[0],score:parseFloat(c[8]),setting:'query translation: '+c[2]+'; answer translation: '+c[3],metrics:{englishF1:Number(c[7])}});}return checked(out,3);
 }};export default board;
