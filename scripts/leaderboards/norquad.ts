// NorQuAD tests Norwegian extractive question answering on Wikipedia and news passages.
// The headline is all-split token F1, with exact match and split metrics retained.
// This importer reads Table 4 of the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2023.nodalida-1.17.pdf';
const board:Leaderboard={benchmark:'norquad',static:'paper',url:'https://aclanthology.org/2023.nodalida-1.17/',feed,terms:'ACL Anthology papers are available under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',parts:{wikiF1:'Wikipedia F1',newsF1:'News F1'},stats:{wikiEM:{name:'Wikipedia exact match',unit:'%',better:'higher'},newsEM:{name:'News exact match',unit:'%',better:'higher'}},async fetch():Promise<LeaderboardRow[]>{const p=await pdfText(feed);if(!/NorBERT2\s+57\.76 ± 1\.15[\s\S]*77\.86 ± 0\.65/.test(p))throw new Error('Missing NorQuAD Table 4');const rows: [string, number, number, number, number, number, number, number, number][]=[['NorBERT2',64.64,77.86,1.40,.65,57.76,71.89,64.05,76.93],['NB-BERT',69.68,81.27,1.21,.73,59.74,74.16,67.64,79.17],['mBERT',63.32,76.00,1.58,.83,55.70,71.21,63.12,73.96],['XLM-RoBERTa',64.52,78.42,1.37,.97,54.33,70.00,61.72,75.62],['NB-BERTger',68.78,80.76,1.38,.62,65.23,78.50,70.80,80.76]];return checked(rows.map(r=>({model:r[0],score:r[2],low:r[2]-r[4],high:r[2]+r[4],metrics:{wikiEM:r[5],wikiF1:r[6],newsEM:r[7],newsF1:r[8]}})),5);}};export default board;
