// BillSum tests legislative document summarization on Congressional and California bills.
// Table 2 reports ROUGE F-scores for seven named systems, with ROUGE-1 as the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/D19-5406.pdf';
const board:Leaderboard={benchmark:'billsum',url:'https://aclanthology.org/D19-5406/',feed,static:'paper',headline:'The paper reports ROUGE-1, ROUGE-2 and ROUGE-L, so this headline is the first ROUGE-1 column.',terms:'ACL Anthology papers are available under the terms at https://aclanthology.org/faq/copyright/.',parts:{rouge1:'ROUGE-1',rouge2:'ROUGE-2',rougeL:'ROUGE-L'},async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 2: ROUGE F-scores')) throw new Error('Missing BillSum Table 2');
 const vals=[['SumBasic',30.74,14.16,23.92],['LSA',32.64,15.69,26.26],['TextRank',34.35,17.77,27.80],['DOC',38.51,21.38,31.49],['SUM',40.69,23.88,33.65],['DOC + SUM',40.80,23.83,33.73]] as const;
 return checked(vals.map(([model,a,b,c])=>({model,score:a,metrics:{rouge2:b,rougeL:c}})),6);
}}; export default board;
