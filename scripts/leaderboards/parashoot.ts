// ParaShoot tests Hebrew extractive question answering.
// Table 4 reports F1 for three named Hebrew BERT baselines on the test set.
import type {Leaderboard} from './types.ts'; import {pdfText} from '../lib/boards/pdf-text.ts'; import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2021.mrqa-1.11.pdf';
const board:Leaderboard={benchmark:'parashoot',url:'https://aclanthology.org/2021.mrqa-1.11/',feed,static:'paper',terms:'ACL Anthology papers are available under their stated publication terms. https://aclanthology.org/faq/copyright/',async fetch(){const p=await pdfText(feed);if(!p.includes('HeBERT       36.7')||!p.includes('mBERT        56.1'))throw new Error('Missing ParaShoot Table 4');return checked([{model:'HeBERT',score:36.7,metrics:{exactMatch:18.2}},{model:'AlephBERT',score:49.6,metrics:{exactMatch:26}},{model:'mBERT',score:56.1,metrics:{exactMatch:32}}],3);}};export default board;
