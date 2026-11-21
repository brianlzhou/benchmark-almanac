// BigLaw Bench SPA Deal Points tests extraction of verified legal deal points.
// Harvey's article reports overall accuracy for three named model systems.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://www.harvey.ai/blog/biglaw-bench-workflows-spa-deal-points';
const board:Leaderboard={benchmark:'biglaw-bench-spa-deal-points',url:feed,feed,terms:'Harvey publishes these benchmark results in its article. '+feed,async fetch(){const p=await fetchText(feed);if(!p.includes('66.04%')||!p.includes('72.27%')||!p.includes('98.47%'))throw Error('Missing BigLaw Bench scores');return checked([{model:'GPT-4o',score:66.04},{model:'Gemini',score:72.27},{model:'Harvey SPA agents',score:98.47,harness:'Harvey agent'}],3);}};export default board;
