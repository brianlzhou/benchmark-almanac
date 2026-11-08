// Business Operation: the author image alt text prints two whole-benchmark percentage scores.
// Finance Modeling and Financial Research are different benchmarks and are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://www.kimi.com/en/blog/kimi-k3-1-pro";
const board: Leaderboard = {
 benchmark: "business-operation-moonshot",
 url: "https://www.kimi.com/en/blog/kimi-k3-1-pro",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const html=await fetchText(FEED);const tags=[...html.matchAll(/<img\b[^>]*\balt="([^"]*)"[^>]*>/g)].map(m=>text(m[1]));const alt=tags.find(x=>x.startsWith('Internal Finance Benchmark:'));if(!alt)throw new Error('Internal Finance alt text missing');const m=alt.match(/Internal Finance Benchmark: (.+?) versus (.+?) on .*Internal Business Operation \(([\d.]+) vs ([\d.]+)\)/);if(!m)throw new Error('Business Operation alt schema changed');return checked([{model:m[1],score:Number(m[3])},{model:m[2].startsWith('Kimi')?m[2]:'Kimi '+m[2],score:Number(m[4])}],2);
 },
};
export default board;
