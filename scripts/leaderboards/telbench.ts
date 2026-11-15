// Overall macro-F1 on the maker project page, all TELBench trajectory types.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {text} from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://nju-link.github.io/DRIFT/';
const board:Leaderboard={benchmark:'telbench',url:URL,feed:URL,
 terms:'Public maker project page on GitHub Pages; robots.txt has no restriction on this path.',
 async fetch(){const html=await fetchText(URL);const block=html.match(/<div class="score-grid"[^>]*>([\s\S]*?)<\/div>/)?.[1];if(!block)throw new Error('Overall results missing');
 const rows=[...block.matchAll(/<article>\s*<span>([^<]+)<\/span>\s*<strong>([\d.]+)<\/strong>/g)].map(m=>({model:text(m[1]),score:Number(m[2]),harness:'DRIFT'}));return checked(rows,3);
 }};export default board;
