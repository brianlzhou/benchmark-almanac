// Kimi Hallu Bench: the author image alt text prints claim-level hallucination rates, lower is better.
// Use the default set without tools. The Hard set with tools is a distinct subset and is excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://www.kimi.com/blog/kimi-k3-1-pro";
const board: Leaderboard = {
 benchmark: "kimi-hallu-bench",
 stats: {
  hardWithTools: { name: 'Hard subset (with tools)', unit: '%', better: 'lower' },
 },
 url: "https://www.kimi.com/blog/kimi-k3-1-pro",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const html=await fetchText(FEED);const tags=[...html.matchAll(/<img\b[^>]*\balt="([^"]*)"[^>]*>/g)].map(m=>text(m[1]));const alt=tags.find(x=>x.startsWith('Kimi Hallu Bench claim-level'));if(!alt)throw new Error('Kimi hallucination alt text missing');const s=alt.match(/without tools, (.*?); Hard with tools, (.*?)$/);if(!s)throw new Error('Kimi hallucination default set missing');const parse=(list:string)=>list.split(', ').map(v=>{const m=v.match(/^(.+?) (\d+(?:\.\d+)?)$/);if(!m)throw new Error('Kimi hallucination row changed');let model=m[1];if(/^(Opus|Fable)/.test(model))model='Claude '+model;return [model,Number(m[2])] as const;});const hard=new Map(parse(s[2]));return checked(parse(s[1]).map(([model,score])=>{const h=hard.get(model);return {model,score,setting:'without tools',metrics:h!==undefined?{hardWithTools:h}:undefined};}),6);
 },
};
export default board;
