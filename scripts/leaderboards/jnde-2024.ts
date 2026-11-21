// Japanese National Dental Examination 2024 tests multimodal medical question answering.
// The article abstract reports overall correct response rates for four named models.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://jds.ads.org.tw/journal/vol20/iss4/64/';
const board:Leaderboard={benchmark:'jnde-2024',url:feed,feed,static:'paper',terms:'The journal article is publicly readable for research use. https://jds.ads.org.tw/',async fetch(){const p=await fetchText(feed);if(!/o1 achieved the highest overall correct response rate \(81\.9 %\)/.test(p))throw new Error('Missing JNDE abstract results');return checked([{model:'OpenAI o1',score:81.9},{model:'Claude 3.5 Sonnet',score:71.7},{model:'Gemini 2.0 Flash Thinking Experimental',score:66.6},{model:'ChatGPT-4o',score:65.7}],4);}};export default board;
