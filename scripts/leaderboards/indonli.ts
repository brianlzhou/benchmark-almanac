// IndoNLI tests Indonesian natural language inference.
// The headline is TestEXPERT accuracy from Table 6, reported as a percentage in the paper.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2021.emnlp-main.821.pdf';
const board:Leaderboard={benchmark:'indonli',url:'https://aclanthology.org/2021.emnlp-main.821/',feed,static:'paper',terms:'ACL Anthology papers are available under their stated publication terms. https://aclanthology.org/faq/copyright/',stats:{TestLAY:{name:'Lay-annotated test accuracy',unit:'%',better:'higher'}},async fetch(){const p=await pdfText(feed);if(!/IndoBertlite\s+76\.2\(0\.5\).*XLM-R\s+85\.7\(0\.4\)/s.test(p))throw new Error('Missing IndoNLI Table 6');return checked([{model:'IndoBertlite',score:58.9,metrics:{TestLAY:74.1}},{model:'IndoBertlarge',score:61.5,metrics:{TestLAY:77.1}},{model:'mBERT',score:57.3,metrics:{TestLAY:72.5}},{model:'XLM-R',score:70.3,metrics:{TestLAY:82.3}}],4);}};export default board;
