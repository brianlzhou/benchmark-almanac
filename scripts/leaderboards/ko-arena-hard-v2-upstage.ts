// Ko-Arena-Hard v2: exact whole-benchmark scores from the author release prose.
// The Full Benchmark Details paragraph identifies both exact API snapshots.
// The image CDN was unavailable. The HTML publishes both scores independently.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://www.upstage.ai/blog/en/solar-pro-3-0323";
const board: Leaderboard = {
 benchmark: "ko-arena-hard-v2-upstage",
 url: "https://www.upstage.ai/blog/en/solar-pro-3-0323",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",
 stats: { activeParams: { name: 'Active parameters', unit: 'billions' } },

 async fetch(): Promise<LeaderboardRow[]> {

 const s=text(await fetchText(FEED));
 const m=s.match(/On Ko-Arena-hard-v2, Solar Pro 3 reaches\s*(\d+(?:\.\d+)?)\s*, up from Solar Pro 2[’']s\s*(\d+(?:\.\d+)?)/);
 if(!m || !s.includes('solar-pro2-251215') || !s.includes('solar-pro3-260323')) throw new Error('Ko-Arena scores or snapshot provenance changed');
 const size=s.match(/Solar Pro 3 is built on a Mixture-of-Experts architecture with (\d+(?:\.\d+)?)B total parameters, activating only (\d+(?:\.\d+)?)B/);
 return checked([{model:'solar-pro3-260323',score:Number(m[1]),params:size?Number(size[1]):undefined,metrics:size?{activeParams:Number(size[2])}:undefined},{model:'solar-pro2-251215',score:Number(m[2])}]);

 },
};
export default board;
