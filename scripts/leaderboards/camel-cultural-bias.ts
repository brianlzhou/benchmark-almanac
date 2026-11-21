// CAMeL measures Cultural Bias Score on Arabic culture prompts.
// Table 10 reports the average CBS for each named language model, where lower is better.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2024.acl-long.862.pdf';
const board:Leaderboard={benchmark:'camel-cultural-bias',url:'https://aclanthology.org/2024.acl-long.862/',feed,static:'paper',terms:'ACL Anthology papers are available under the terms at https://aclanthology.org/faq/copyright/.',async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 10: Cultural Bias Scores')) throw new Error('Missing CAMeL Table 10');
 const vals=[['ARBERT',46.40],['MARBERT',49.33],['AraBERT B',49.33],['AraBERT L',48.20],['AraBERT-T B',50.27],['AraBERT-T L',46.50],['CAMeLBERT',57.09],['CAMeLBERT-MSA',56.82],['CAMeLBERT-DA',56.53],['mBERT',49.18],['GigaBERT',54.37],['GigaBERT-CS',57.73],['XLM-R B',50.43],['XLM-R L',54.04],['AraGPT2 B',53.23],['AraGPT2 L',45.52],['BLOOM',63.47],['AceGPT',60.37],['JAIS',51.15],['GPT-3.5',62.47],['mT5 XXL',48.80],['AYA',50.66]] as const;
 return checked(vals.map(([model,score])=>({model,score})),22);
}}; export default board;
