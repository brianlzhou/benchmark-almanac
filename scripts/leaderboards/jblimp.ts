// JBLiMP tests Japanese language models on grammatical minimal pairs.
// Table 5 reports overall accuracy across the 331 pairs.
import type {Leaderboard} from './types.ts'; import {pdfText} from '../lib/boards/pdf-text.ts'; import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2023.findings-eacl.117.pdf';
const board:Leaderboard={benchmark:'jblimp',url:'https://aclanthology.org/2023.findings-eacl.117/',feed,static:'paper',terms:'ACL Anthology papers are available under their stated publication terms. https://aclanthology.org/faq/copyright/',async fetch(){const p=await pdfText(feed);if(!/Trans-LG\s+77\.95\s+89\.05\s+53\.55/s.test(p))throw new Error('Missing JBLiMP Table 5');return checked([{model:'Trans-LG',score:77.95},{model:'Trans-SM',score:76.54},{model:'LSTM',score:75.73},{model:'5-gram',score:74.02}],4);}};export default board;
