// Overall oracle-normalized score, excluding oracle/random baselines. Fine-tunes keep their full names.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables,num} from '../lib/html.ts';
const URL='https://roger-creus.github.io/agentick/board/';
const board:Leaderboard={benchmark:'agentick',url:URL,feed:URL,
 terms:'MIT repository; the project site has no robots.txt.',
 async fetch(){
  const table=tables(await fetchText(URL)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.includes('95% CI'));
  if(!table)throw new Error('Overall table missing');
  const rows=table.slice(1).filter(c=>c[2]!=='other').map(c=>{
   const effort=c[1].match(/ \((high, 1 seed)\)$/);const ci=c[6].replace(/&ndash;/g,'–').split('–').map(Number);
   return {model:effort?c[1].slice(0,effort.index):c[1],harness:c[4]==='–'?undefined:c[4],setting:[c[3],effort?.[1]].filter(Boolean).join(', '),score:num(c[5])!,date:c[8],metrics:{ciLow:ci[0],ciHigh:ci[1]}};
  });
  if(rows.length<3||rows.some(r=>!Number.isFinite(r.score)))throw new Error('Invalid overall rows');return rows;
 }};export default board;
