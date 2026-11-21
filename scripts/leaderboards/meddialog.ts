// MedDialog evaluates medical dialogue generation on Chinese conversations.
// The paper reports multiple generation measures with no overall score, so the headline uses NIST-4.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2020.emnlp-main.743.pdf';
const rows=[['Transformer',0.39,4.9,0.9,13.1,13.5,0.03,2.0],['BERT-GPT',0.31,3.7,0.5,10.4,13.6,0.02,2.1],['GPT',0.36,5.0,1.8,12.1,13.6,0.02,2.0]] as const;
const board:Leaderboard={benchmark:'meddialog',static:'paper',url:'https://aclanthology.org/2020.emnlp-main.743/',feed:FEED,terms:'The paper is available from ACL Anthology under the publication terms. https://aclanthology.org/faq/copyright/',headline:'The paper reports no overall score, so this is the NIST-4 column from its main Chinese test table.',parts:{nist4:{name:'NIST-4'},bleu2:{name:'BLEU-2'},bleu4:{name:'BLEU-4'},meteor:{name:'METEOR'}},stats:{entropy4:{name:'4-gram entropy',unit:'score',better:'higher'},dist1:{name:'Distinct-1',unit:'score',better:'higher',note:'Distinct-1 stored from 0 to 1.'},dist2:{name:'Distinct-2',unit:'score',better:'higher'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 5: Performance on the MedDialog-CN test set'))throw Error('MedDialog Table 5 missing');return checked(rows.map(r=>({model:r[0],score:r[1],metrics:{bleu2:r[2],bleu4:r[3],meteor:r[4],entropy4:r[5],dist1:r[6],dist2:r[7]}})),3)}};
export default board;
