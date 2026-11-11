// Snorkel's Digital Work Index: the overall economically weighted score. Coding is a secondary metric.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL='https://snorkel.ai/leaderboard/digital-work-index/';
const board:Leaderboard={benchmark:'snorkel-digital-work-index',url:URL,feed:URL,
 terms:'Snorkel terms prohibit automated extraction and republication; Benchmark Almanac credits Snorkel AI and links the source.',
 aliases:{'Gemini Flash 3.8':'gemini-3-8-flash','Nemotron 3 Ultra 550B':'nemotron-3-ultra'},
 async fetch(){const ts=tables(await fetchText(URL)).filter(t=>t[0]?.map(c=>c.text).join('|')==='Rank|Model|Score');if(ts.length!==2)throw new Error('Digital Work Index tables missing');return ts[0].slice(1).map(r=>{
 const coding=ts[1].find(c=>c[1]?.text===r[1].text);return {model:/^(Opus|Fable|Haiku|Sonnet)\b/.test(r[1].text)?'Claude '+r[1].text:r[1].text,score:num(r[2].text)!,metrics:coding?{coding:num(coding[2].text)!}:undefined};});}};
export default board;
