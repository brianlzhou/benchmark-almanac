// Overall policy rule-matching rate. The source arrays are L0, L1, L2, Overall, in percent.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {jsonAfter} from '../lib/html.ts';
const FEED='https://bytedance.github.io/safepyramid/data.js';
const board:Leaderboard={benchmark:'safepyramid',url:'https://bytedance.github.io/safepyramid/',feed:FEED,
 terms:'Apache-2.0 project; the maker site has no robots.txt. JavaScript data is parsed, never executed.',
 async fetch(){
  const d=jsonAfter<{overallPolicy:Record<string,{RMR:number[];'RMR@1.0':number[];RDR:number[];Refusal:number}>}>(await fetchText(FEED),'window.SP_DATA =');
  const rows=Object.entries(d.overallPolicy).map(([model,r])=>({model,score:r.RMR[3],metrics:{l0:r.RMR[0],l1:r.RMR[1],l2:r.RMR[2],exact:r['RMR@1.0'][3],rdr:r.RDR[3],refusal:r.Refusal}}));
  if(rows.length<3||rows.some(r=>!Number.isFinite(r.score)))throw new Error('Invalid overall policy rows');return rows;
 }};export default board;
