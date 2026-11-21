// KCL tests Korean legal question answering and essay evaluation. Table 2 reports MCQA scores before and after precedent context.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2512.24572';
const board:Leaderboard={benchmark:'korean-canonical-legal-benchmark',url:feed,feed,static:'paper',terms:'The authors publish the paper on arXiv. '+feed.replace('/html/','/abs/'),async fetch(){
 const h=await paperHtml(feed),plain=h.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ');
 const names=['GPT-4.1','Claude 3.5 Sonnet','GPT-4o','Gemma 3 27B','GPT-4o-mini','GPT-4.1-mini','Kanana 1.5 8B','Aya Expanse 32B','Claude 3.5 Haiku','Phi-4-mini'];
 const rows:LeaderboardRow[]=[];
 for(const name of names){const i=plain.indexOf(name);const m=plain.slice(i,i+180).match(/→\\s*([0-9.]+)\\s*±\\s*([0-9.]+)/);if(!m)throw new Error('Missing KCL row '+name);rows.push({model:name,score:numberCell(m[1]),metrics:{withPrecedent:numberCell(m[1])}});}
 return checked(rows,10);
}}; export default board;
