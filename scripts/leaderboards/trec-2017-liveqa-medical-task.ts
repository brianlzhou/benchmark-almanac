// TREC 2017 LiveQA Medical Task evaluates consumer health question answering systems.
// The official overview's Table 2 reports average score on the 0 to 3 scale.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://trec.nist.gov/pubs/trec26/papers/Overview-QA.pdf';
const board:Leaderboard={benchmark:'trec-2017-liveqa-medical-task',url:feed,feed,static:'paper',terms:'NIST publishes the TREC overview paper. https://trec.nist.gov/pubs/trec26/trec2017.html',async fetch(){const p=await pdfText(feed);if(!p.includes('CMU-OAQA                  0.637'))throw Error('Missing LiveQA Table 2');return checked([{model:'CMU-OAQA',score:0.637},{model:'prna-r1',score:0.490},{model:'prna-run2',score:0.441},{model:'prna-run3',score:0.431},{model:'ECNU ICA 2',score:0.402},{model:'CMU-LiveMedQA',score:0.353},{model:'ECNU ICA 1',score:0.255},{model:'ECNU',score:0.137}],8);}};export default board;
