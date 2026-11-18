// TrueSkill mean for complete products. No base model is disclosed.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {text} from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://www.uibench.ai/';
const board:Leaderboard={benchmark:'ui-bench',harnesses:'system',url:URL,feed:URL,
 terms:'Public maker results; robots.txt does not restrict this page. No additional reading restriction is stated.',
 async fetch(){const html=await fetchText(URL);const rows=[];
 for(const m of html.matchAll(/<div class="font-semibold mb-1">([^<]+)<\/div><div>Rating \(μ\):([\s\S]*?)<div class="absolute top-full/g)){
 const values=text(m[2]).match(/([\d.]+).*?95% CI:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\].*?Win rate:\s*([\d.]+)/);
 if(!values)throw new Error('Rating tooltip changed');rows.push({model:text(m[1]),score:Number(values[1]),low:Number(values[2]),high:Number(values[3]),metrics:{ciLow:Number(values[2]),ciHigh:Number(values[3]),winRate:Number(values[4])}});
 }return checked(rows,3);
 }};export default board;
