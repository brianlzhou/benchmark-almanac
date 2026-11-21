// HealthAdvice classifies sentences as no, weak or strong health advice.
// Table 3 reports macro F1 for the BioBERT, BERT and SVM model comparisons.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2021.emnlp-main.486.pdf';
const board:Leaderboard={benchmark:'healthadvice',url:'https://aclanthology.org/2021.emnlp-main.486/',feed,static:'paper',parts:{none:'None',weak:'Weak',strong:'Strong'},terms:'ACL Anthology papers are available under the terms at https://aclanthology.org/faq/copyright/.',async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 3: Model performance of detecting different types')) throw new Error('Missing HealthAdvice Table 3');
 const vals=[['BioBERT',93.3,95.7,91.5,92.8],['BERT',91.8,95.0,90.1,90.4],['SVM',83.3,87.0,80.1,82.8]] as const;
 return checked(vals.map(([model,score,none,weak,strong])=>({model,score,metrics:{none,weak,strong}})),3);
}}; export default board;
