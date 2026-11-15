// Official 200-task Verified leaderboard, Terminus-2 with default reasoning effort.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables,num} from '../lib/html.ts';
const URL='https://terminalworld.ai/leaderboard';
const board:Leaderboard={benchmark:'terminalworld',url:URL,feed:URL,
 terms:'The maker site states CC BY 4.0 and robots.txt permits the leaderboard path.',costPer:'run',
 async fetch(){
  const table=tables(await fetchText(URL)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.includes('Solved / Total'));
  if(!table)throw new Error('Verified table missing');
  const rows=table.slice(1).map(c=>({model:c[1],harness:c[3],setting:'Verified, default reasoning effort',score:num(c[4])!,cost:num(c[7]),date:new Date(c[6]).toISOString().slice(0,10),metrics:{solved:num(c[5])!,costPerPass:num(c[8])!}}));
  if(rows.length<3||rows.some(r=>!Number.isFinite(r.score)))throw new Error('Invalid verified results');return rows;
 }};export default board;
