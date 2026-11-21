// BasqueGLUE evaluates Basque language understanding across nine tasks.
// The paper's AVG column is the unweighted mean of the task scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2022.lrec-1.172.pdf';
const board:Leaderboard={benchmark:'basqueglue',url:'https://aclanthology.org/2022.lrec-1.172/',feed,static:'paper',terms:'ACL Anthology papers are available under the terms at https://aclanthology.org/faq/copyright/.',parts:{nerc:'NERC',fintent:'Fintent',fslot:'Fslot',bhtc:'BHTC',bec:'BEC',vaxx:'Vaxx',qnli:'QNLI',wic:'WiC',coref:'coref'},async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 4: Results of the models')) throw new Error('Missing BasqueGLUE Table 4');
 const rows:LeaderboardRow[]=[];
 const vals=[['BERTeus',[73.23,81.92,82.52,74.34,78.26,69.43,59.30,74.26,70.71,68.31]],['ElhBERTeu',[73.71,82.30,82.24,75.64,78.05,69.89,63.81,73.84,71.71,65.93]]] as const;
 for(const [model,v] of vals) rows.push({model,score:v[0],metrics:{nerc:v[1],fintent:v[2],fslot:v[3],bhtc:v[4],bec:v[5],vaxx:v[6],qnli:v[7],wic:v[8],coref:v[9]}});
 return checked(rows,2);
}}; export default board;
