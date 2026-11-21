// Sayfullina evaluates soft-skill span extraction in job postings.
// Table 3 of the paper reports strict and loose F1 for RoBERTa and JobBERT methods on Sayfullina.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://ceur-ws.org/Vol-3218/RecSysHR2022-paper_10.pdf';
const rows=[
 {model:'RoBERTa',setting:'ISO',score:6.26,metrics:{looseF1:27.90}},
 {model:'RoBERTa',setting:'AOC',score:3.24,metrics:{looseF1:59.48}},
 {model:'RoBERTa',setting:'WSE',score:3.67,metrics:{looseF1:59.61}},
 {model:'JobBERT',setting:'ISO',score:7.71,metrics:{looseF1:28.82}},
 {model:'JobBERT',setting:'AOC',score:4.05,metrics:{looseF1:52.14}},
 {model:'JobBERT',setting:'WSE',score:4.15,metrics:{looseF1:52.69}},
];
const board:Leaderboard={benchmark:'sayfullina-soft-skill-spans',static:'paper',url:'https://ceur-ws.org/Vol-3218/RecSysHR2022-paper_10.pdf',feed:FEED,terms:'The paper is publicly available from CEUR Workshop Proceedings under its publication terms.',parts:{looseF1:{name:'Loose F1'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 3'))throw Error('Sayfullina Table 3 missing');return checked(rows,6)}};
export default board;
