// Cochrane-auto tests biomedical sentence and document simplification.
// Table 5 reports named systems with BARTScore, BLEU, FKGL and SARI.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2024.tsar-1.5.pdf';
const board:Leaderboard={benchmark:'cochrane-auto',url:'https://aclanthology.org/2024.tsar-1.5/',feed,static:'paper',headline:'The paper reports several simplification measures, so this headline is SARI.',terms:'ACL Anthology papers are available under the terms at https://aclanthology.org/faq/copyright/.',stats:{bartScoreF1:{name:'Bidirectional and Auto-Regressive Transformers Score F1',unit:'score',better:'higher'},bleu:{name:'BLEU',unit:'%',better:'higher'},fkgl:{name:'Flesch-Kincaid grade level',unit:'score',better:'lower'}},async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 5: Results of document simplification systems')) throw new Error('Missing Cochrane-auto Table 5');
 const vals=[['Baseline',-3.44,11.4,12.6,34.1],['BARTdoc',-3.53,10.7,12.3,31.6],['BARTpara',-3.34,12.9,12.7,32.9],['BARTsent',-3.20,14.9,12.5,32.0],['O to BARTsent',-3.31,11.1,12.5,35.5]] as const;
 return checked(vals.map(([model,bart,bleu,fkgl,sari])=>({model,score:sari,metrics:{bartScoreF1:bart,bleu,fkgl}})),5);
}}; export default board;
