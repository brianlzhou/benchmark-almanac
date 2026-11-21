// INAS tests classification of research hypotheses in scientific abstracts.
// The headline is the paper's single-label macro F1 score, with multi-label F1 retained in metrics.
// This importer reads Table 2 of the INAS paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2022.wiesp-1.5.pdf';
const board:Leaderboard={benchmark:'inas-hypothesis-classification',url:'https://aclanthology.org/2022.wiesp-1.5/',feed:FEED,static:'paper',terms:'ACL Anthology terms. https://aclanthology.org/faq/copyright/',async fetch(){
 const t=await pdfText(FEED);const s=t.split('Table 2: Classification F1 scores')[0].split(/Model\s+F1\(S\)\s+F1\(M\)/).at(-1);if(!s)throw new Error('INAS Table 2 missing');
 const rows:LeaderboardRow[]=[];const re=/(Naive Bayes|BERT base|BERT large|BioBERT base|BioBERT large|PubMedBERT base)\s+([.\d]+)(?:\s+\(±[.\d]+\))?\s+([.\d]+|[-])?/g;
 for(const m of s.matchAll(re))rows.push({model:m[1],score:Number(m[2]),metrics:m[3]&&m[3]!=='-'?{multiLabelF1:Number(m[3])}:undefined});
 return checked(rows,6);
}};export default board;
