// Owe-Voice evaluates Yoruba speech recognition with word and tone error rates.
// Table 2 reports WER and TER for two named ASR models on the held-out split.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2026.africanlp-main.8.pdf';
const board:Leaderboard={benchmark:'owe-voice',url:'https://aclanthology.org/2026.africanlp-main.8/',feed,static:'paper',terms:'ACL Anthology makes this paper available under its publication terms. https://aclanthology.org/faq/copyright/',stats:{toneErrorRate:{name:'Tone error rate',unit:'%',better:'lower'}},async fetch(){const p=await pdfText(feed);if(!p.includes('NCAIR1/Yoruba-ASR         72.45    27.83'))throw Error('Missing Owe-Voice Table 2');return checked([{model:'NCAIR1/Yoruba-ASR',score:72.45,metrics:{toneErrorRate:27.83}},{model:'MMS-1b-all',score:95.42,metrics:{toneErrorRate:66.75}}],2);}};export default board;
