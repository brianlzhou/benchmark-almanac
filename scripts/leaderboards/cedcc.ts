// CEDCC tests discourse coherence grading on Chinese essays.
// Table 6 in the authors' paper reports precision, recall, F1, and accuracy for ten named models.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2023.emnlp-main.412.pdf';
const board:Leaderboard={benchmark:'cedcc',url:'https://aclanthology.org/2023.emnlp-main.412/',feed:FEED,static:'paper',terms:'ACL Anthology publishes this paper under its public author and venue terms. https://aclanthology.org/2023.emnlp-main.412/',async fetch(){
 await pdfText(FEED);const rows=[['EG RID',35.83,35.12,33.92,40],['EG RAPH',27.89,28.36,27.92,43],['CLIQUE',33.29,33.86,28.45,29.57],['SENTAVG',33.9,34.2,33.99,45],['PARSEQ',35.16,33.58,31.26,34],['BERT',41.42,36.78,34.01,57],['RoBERTa',50.37,47.16,46.73,58],['ChatGPT',34.13,30.26,31.15,55],['ChatGPT3-shot',41.37,42.4,41.49,54]].map(([model,p,r,f,a])=>({model:String(model),score:Number(f),metrics:{precision:Number(p),recall:Number(r),accuracy:Number(a)}}));return checked(rows,9);
}};export default board;
