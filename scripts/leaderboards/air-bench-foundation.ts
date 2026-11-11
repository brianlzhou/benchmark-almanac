import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';
const URL='https://raw.githubusercontent.com/OFA-Sys/AIR-Bench/HEAD/README.md';
const board:Leaderboard={benchmark:'air-bench-foundation',url:'https://github.com/OFA-Sys/AIR-Bench',feed:URL,terms:'Apache-2.0 benchmark repository. The Almanac credits the authors and links the source.',async fetch(){
 const t=markdownTables(await fetchText(URL)).find(t=>t[0]?.[0]==='Categories');
 const avg=t?.find(r=>r[0]==='Average');if(!t||!avg)throw new Error('Foundation average missing');
 return t[0].slice(1).flatMap((model,j)=>{const score=num(avg[j+1]);if(score===undefined)return [];
 return [{model,score,metrics:Object.fromEntries(t.slice(2).filter(r=>r[0]!=='Average').flatMap(r=>{const n=num(r[j+1]);return n===undefined?[]:[[r[0],n]];}))}];});
 }};export default board;
