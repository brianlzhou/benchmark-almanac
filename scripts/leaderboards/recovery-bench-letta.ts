// Recovery-Bench measures task success after a previous agent leaves a failed environment and action history.
// Letta's original-versus-recovery chart prints the five recovery rates and fresh-start baselines.
// We transcribed the bar labels twice and guard the original image by its SHA-256.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const feed='https://www.letta.com/assets/images/blog/recovery-bench-f2.png';
const board:Leaderboard={
  benchmark:'recovery-bench-letta',url:'https://www.letta.com/blog/recovery-bench/',feed,
  terms:'Letta publishes this chart under the site terms at https://www.letta.com/blog/recovery-bench/.',
  stats:{original:{name:'Original Terminal-Bench success rate',unit:'%',better:'higher'}},
  async fetch(){
    return checked(await chartRows(feed,'4c3173adbcc717400a30f0bfa9fbba3aae4835a44563bb042bcd9c751a37f3ad',[
      {model:'GPT-5',score:14.6,metrics:{original:20.2}},
      {model:'Gemini 2.5 Pro',score:13.5,metrics:{original:31.5}},
      {model:'Claude Sonnet 4',score:12.4,metrics:{original:34.8}},
      {model:'o4-mini',score:10.1,metrics:{original:16.9}},
      {model:'GPT-4.1',score:5.6,metrics:{original:28.1}},
    ]),5);
  },
};
export default board;
