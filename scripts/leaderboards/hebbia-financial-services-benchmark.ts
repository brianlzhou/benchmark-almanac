import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL='https://fireworks.ai/specialized-intelligence-index/benchmarks/finance/hebbia-finance-eval';
const board:Leaderboard={benchmark:'hebbia-financial-services-benchmark',url:URL,feed:URL,
 terms:'Fireworks terms restrict automated scraping and copying; the Almanac credits Fireworks and Hebbia and links the source.',
 chart:{title:'Strict pass rate vs. cost',x:{key:'cost',label:'Cost per task',unit:'$',better:'lower'},y:{key:'score',label:'Strict pass rate',unit:'%',better:'higher'}},
 async fetch(){
  const html=await fetchText(URL);const t=tables(html).find(t=>t[0].some(c=>c.text.includes('strict pass rate')));
  if(!t)throw new Error('Hebbia strict-pass table missing');
  const date=html.match(/Last updated ([A-Z][a-z]{2} \d{1,2}, \d{4})/)?.[1];
  const rows:LeaderboardRow[]=[];
  for(const r of t.slice(1)){const score=num(r[3]?.text);if(score!==undefined)rows.push({model:r[1].text,score,cost:num(r[4]?.text),date:date?new Date(date+' UTC').toISOString().slice(0,10):undefined});}
  if(!rows.length)throw new Error('No Hebbia scores');return rows;
 }};
export default board;
