// Overall macro-F1 on the maker project page, all TELBench trajectory types.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {text} from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://nju-link.github.io/DRIFT/';
const board:Leaderboard={benchmark:'telbench',url:URL,feed:URL,
 terms:'Public maker project page on GitHub Pages; robots.txt has no restriction on this path.',
 stats:{gainOverBare:{name:'Gain over bare prompting',unit:'%',better:'higher'}},
 async fetch(){const html=await fetchText(URL);const block=html.match(/<div class="score-grid"[^>]*>([\s\S]*?)<\/div>/)?.[1];if(!block)throw new Error('Overall results missing');
 const rows=[...block.matchAll(/<article>\s*<span>([^<]+)<\/span>\s*<strong>([\d.]+)<\/strong>(?:\s*<small>([^<]+)<\/small>)?/g)].map(m=>{
  const gain=m[3]?.match(/([+-]?\d+(?:\.\d+)?)\s+over bare/i)?.[1];
  return {model:text(m[1]),score:Number(m[2]),harness:'DRIFT',...(gain!==undefined?{metrics:{gainOverBare:Number(gain)}}:{})};
 });return checked(rows,3);
 }};export default board;
