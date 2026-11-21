// MIT-Adobe FiveK tests automatic photo adjustment against expert retouching.
// Table 1 reports LAB error, where lower is better, for five named methods.
import type {Leaderboard} from './types.ts'; import {pdfText} from '../lib/boards/pdf-text.ts'; import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://people.csail.mit.edu/vladb/photoadjust/db_imageadjust.pdf';
const board:Leaderboard={benchmark:'mit-adobe-fivek',static:'paper',url:'https://people.csail.mit.edu/vladb/photoadjust/',feed:FEED,terms:'The paper is publicly available from MIT CSAIL. Cite the paper and follow its source terms.',async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 1. LAB error of several methods'))throw Error('MIT-Adobe FiveK Table 1 missing');return checked([{model:'mean',score:13.2},{model:'metric learning',score:11.5},{model:'LSR',score:5.2},{model:'LASSO',score:4.9},{model:'GPR',score:4.7}],5)}}; export default board;
