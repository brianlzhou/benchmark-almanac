// RoCS-MT v2 evaluates machine translation of non-standard user-generated text.
// Table 1 ranks 56 named submissions by the mean rank from CometKiwi and MetricX.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2025.wmt-1.58.pdf';
const board:Leaderboard={benchmark:'rocs-mt-2',url:'https://aclanthology.org/2025.wmt-1.58/',feed,static:'paper',terms:'ACL Anthology makes this paper available under its publication terms. https://aclanthology.org/faq/copyright/',async fetch(){
 const p=await pdfText(feed); const table=p.split(/System\s+#lp\s+CometKiwi/)[1]?.split('Table 1: Main ranking table')[0]; if(!table)throw Error('Missing RoCS-MT Table 1');
 const rows:LeaderboardRow[]=[]; for(const line of table.split('\n')){const m=line.match(/^\s*(.+?)\s+(\d+)\s+\d+\s+[\d, ]+\s+\d+\s+[\d, ]+\s+(\d+)\s+\d+\s*$/);if(!m)continue; const model=m[1].replace(/^\*/,'').replace(/[⋄]$/,'').trim(); rows.push({model,score:Number(m[3]),metrics:{languagePairs:Number(m[2])}}); }
 if(rows.length<50)throw Error('Incomplete RoCS-MT ranking'); return checked(rows,50);
}}; export default board;
