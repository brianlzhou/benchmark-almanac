// EVVE tests retrieval of videos depicting the same real-world event.
// The paper defines avg-mAP as the mean of event mAP across 13 events and reports three retrieval methods in Table 3.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://openaccess.thecvf.com/content_cvpr_2013/papers/Revaud_Event_Retrieval_in_2013_CVPR_paper.pdf';
const board:Leaderboard={benchmark:'evve',url:'https://openaccess.thecvf.com/content_cvpr_2013/html/Revaud_Event_Retrieval_in_2013_CVPR_paper.html',feed,static:'paper',terms:'The CVF Open Access paper is available for research use. https://openaccess.thecvf.com/',async fetch(){const p=await pdfText(feed);if(!/avg-mAP\s+0\.334\s+0\.352\s+0\.376/.test(p))throw new Error('Missing EVVE Table 3');return checked([{model:'MMV',score:0.334},{model:'CTE',score:0.352},{model:'MMV+CTE',score:0.376}],3);}};export default board;
