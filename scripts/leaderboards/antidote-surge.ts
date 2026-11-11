// Public Antidote Everyday leaderboard, read from Webflow's rendered model rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import {fetchText} from '../lib/util.ts';
import {text,num} from '../lib/html.ts';
const PAGE='https://surgehq.ai/benchmarks/antidote';
const board:Leaderboard={benchmark:'antidote-surge',url:PAGE,feed:PAGE,terms:'Surge restricts automated site access in its terms. The Almanac credits Surge AI and links the source.',async fetch(){
 const s=await fetchText(PAGE);const rows:LeaderboardRow[]=[];
 for(const block of s.split('data-leaderboard-row=""').slice(1)){
  const brand=text(block.match(/class="head-rank-table-brand">([\s\S]*?)<\/div><\/div>/)?.[1]??'');
  const name=text(block.match(/class="head-rank-table-name">([\s\S]*?)<\/div><\/div>/)?.[1]??'');
  const score=num(block.match(/fs-list-field="foundational-score"[^>]*>([^<]+)/)?.[1]);
  const ciLow=num(block.match(/data-leaderboard-ci-lower="([^"]+)/)?.[1]);const ciHigh=num(block.match(/data-leaderboard-ci-upper="([^"]+)/)?.[1]);
  if(!name||score===undefined)continue;
  const full=[brand,name].filter(Boolean).join(' ');const m=full.match(/^(.*?)\s*\(([^)]+)\)$/);
  const model=m?.[1]??full;rows.push({model,score,setting:m?.[2],metrics:{...(ciLow!==undefined?{ciLow}:{}),...(ciHigh!==undefined?{ciHigh}:{})}});
 }
 if(!rows.length)throw new Error('Antidote model rows missing');return rows;
}};export default board;
