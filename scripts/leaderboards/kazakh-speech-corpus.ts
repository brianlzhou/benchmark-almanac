// The Kazakh Speech Corpus paper evaluates speech recognizers on held-out recordings.
// The headline is test word error rate, where lower is better, with test character error rate retained.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2021.eacl-main.58.pdf';
const rows=[['DNN-HMM','1',13.7,4.6],['DNN-HMM','2',13.8,4.7],['E2E-LSTM','3',28.8,8.7],['E2E-LSTM','4',18.5,7.2],['E2E-LSTM','5',14.4,5.0],['E2E-LSTM','6',11.7,4.0],['E2E-Transformer','7',18.8,4.9],['E2E-Transformer','8',11.9,3.7],['E2E-Transformer','9',10.5,3.2],['E2E-Transformer','10',8.7,2.8]] as const;
const board:Leaderboard={benchmark:'kazakh-speech-corpus',static:'paper',url:'https://aclanthology.org/2021.eacl-main.58/',feed:FEED,terms:'The paper is available from ACL Anthology under its publication terms. https://aclanthology.org/faq/copyright/',parts:{cer:{name:'Test character error rate',unit:'%'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 3: The CER (%) and WER (%)'))throw Error('Kazakh Speech Corpus Table 3 missing');return checked(rows.map(r=>({model:`${r[0]} ${r[1]}`,score:r[2],metrics:{cer:r[3]}})),10)}};
export default board;
