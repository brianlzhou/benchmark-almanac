// Chinese WPLC measures long-range word prediction in Chinese passages.
// Table 5 reports Top-1 and Top-3 accuracy for development and test data.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2021.emnlp-main.306.pdf';
const board:Leaderboard={benchmark:'chinese-wplc',url:'https://aclanthology.org/2021.emnlp-main.306/',feed,static:'paper',terms:'ACL Anthology papers are available under the terms at https://aclanthology.org/faq/copyright/.',parts:{top1Test:'Top-1 test accuracy',top3Test:'Top-3 test accuracy'},async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 5: Top-1 and Top-3 accuracy')) throw new Error('Missing Chinese WPLC Table 5');
 const vals=[['CPM',0.5,1.5],['CPM-kd',0.9,2.4],['PanGu-α',12.1,undefined],['BERT-base',6.3,8.9],['RoBERTa-base',5.7,8.9],['MacBERT-large',7.5,10.5],['ALBERT-xxlarge',3.8,5.4]] as const;
 return checked(vals.map(([model,score,top3])=>({model,score,metrics:top3===undefined?{}:{top3Test:top3} as Record<string,number>})),7);
}}; export default board;
