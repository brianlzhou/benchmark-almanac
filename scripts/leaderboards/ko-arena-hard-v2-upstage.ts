// Ko-Arena-Hard v2: exact whole-benchmark scores from the author release prose.
// The Full Benchmark Details paragraph identifies both exact API snapshots.
// The image CDN was unavailable. The HTML publishes both scores independently.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://www.upstage.ai/blog/en/solar-pro-3-0323";
const board: Leaderboard = {
 benchmark: "ko-arena-hard-v2-upstage",
 url: "https://www.upstage.ai/blog/en/solar-pro-3-0323",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {

 const s=text(await fetchText(FEED));
 const m=s.match(/On Ko-Arena-hard-v2, Solar Pro 3 reaches\s*(\d+(?:\.\d+)?)\s*, up from Solar Pro 2[’']s\s*(\d+(?:\.\d+)?)/);
 if(!m || !s.includes('solar-pro2-251215') || !s.includes('solar-pro3-260323')) throw new Error('Ko-Arena scores or snapshot provenance changed');
 return checked([{model:'solar-pro3-260323',score:Number(m[1])},{model:'solar-pro2-251215',score:Number(m[2])}]);

 },
};
export default board;
