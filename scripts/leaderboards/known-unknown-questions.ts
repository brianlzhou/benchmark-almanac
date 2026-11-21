// Known-Unknown Questions tests whether language models distinguish answerable from unanswerable questions.
// The paper's Table 4 reports F1 and equal error rate on the full KUQ dataset.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2024.findings-acl.383.pdf';
const rows=[['GPT-4',0.251,0.762],['GPT-3.5',0.271,0.747],['Llama 70B-Chat',0.318,0.721],['Llama 13B-Chat',0.451,0.545],['Llama 7B-Chat',0.309,0.742],['Llama-70B',0.488,0.513],['Llama-13B',0.489,0.512],['Llama-7B',0.433,0.561],['Fine-tuned-13B-Chat',0.252,0.788],['Fine-tuned-7B-Chat',0.275,0.742],['Fine-tuned-13B',0.284,0.735],['Fine-tuned-7B',0.355,0.685]] as const;
const board:Leaderboard={benchmark:'known-unknown-questions',static:'paper',url:'https://aclanthology.org/2024.findings-acl.383/',feed:FEED,terms:'The paper is available from ACL Anthology under its publication terms. https://aclanthology.org/faq/copyright/',stats:{eer:{name:'Equal error rate',unit:'score',better:'lower',note:'Threshold where false acceptance and false rejection rates are equal, from 0 to 1.'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 4: Table of Direct Question Answering'))throw Error('KUQ Table 4 missing');return checked(rows.map(r=>({model:r[0],score:r[2],metrics:{eer:r[1]}})),12)}};
export default board;
