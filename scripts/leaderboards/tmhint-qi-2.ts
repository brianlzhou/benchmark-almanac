// TMHINT-QI evaluates speech quality and intelligibility prediction on Taiwanese Mandarin speech.
// The paper reports no combined score, so the headline is speech-quality LCC, the first primary metric.
// Table 3 in the paper reports LCC, SRCC, and MSE for named assessment systems on both tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED='https://arxiv.org/pdf/2309.12766';
const board:Leaderboard={benchmark:'tmhint-qi-2',static:'paper',url:FEED,feed:FEED,terms:'The paper is published under the arXiv terms. https://arxiv.org/licenses/nonexclusive-distrib/1.0/',headline:'The paper reports no combined score, so this is speech-quality LCC, the first primary metric.',stats:{srcc:{name:'Spearman rank correlation',unit:'score',better:'higher'},mse:{name:'Mean squared error',unit:'score',better:'lower'}},async fetch(){
 const p=await pdfText(FEED); const chunk=p.slice(p.indexOf('Table 3.'),p.indexOf('superior performance in all evaluation metrics')); if(!chunk.includes('Speech Quality Prediction')) throw new Error('TMHINT-QI Table 3 missing'); let setting='Speech Quality'; const rows:LeaderboardRow[]=[];
 for(const raw of chunk.split(/\r?\n/)){const line=raw.trim(); if(line.includes('Speech Intelligibility Prediction')){setting='Speech Intelligibility';continue;} const m=line.match(/^(.+?)\s+([0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+)\s+(-|[0-9]+\.[0-9]+)$/); if(!m) continue; const model=m[1].replace(/\s*\[\d+\]/g,'').trim(); if(!['CSIG','CBAK','COVL','MOS-SSL','MOSA-Net','MOSA-Net+','MOSA-Net+adapt','ESTOI'].includes(model)) continue; rows.push({model,setting,score:Number(m[2]),metrics:{srcc:Number(m[3]),...(m[4]==='-'?{}:{mse:Number(m[4])})}}); }
 if(rows.length<8) throw new Error('TMHINT-QI rows missing'); return rows;
}}; export default board;
