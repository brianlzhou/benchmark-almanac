// Arena-Hard v0.1's archived rankings, read from the maintained repository's main branch. The first
// console block is style-controlled and the second is the original win rate, both in percent. Keep
// their settings separate and preserve average answer tokens and the bootstrap interval offsets.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/Arena-OSS/arena-hard-auto/main/misc/past_leaderboards.md';
const board: Leaderboard = {
  benchmark: 'arena-hard-auto', url: 'https://github.com/Arena-OSS/arena-hard-auto', feed: FEED,
  terms: 'The official Arena-OSS/arena-hard-auto repository publishes these archived results under its repository license.',
  async fetch() {
    const md = await fetchText(FEED);
    const blocks = [...md.matchAll(/```console\s*([\s\S]*?)```/g)];
    if (blocks.length !== 2) throw new Error('Expected two v0.1 ranking blocks');
    const rows: LeaderboardRow[] = [];
    for (const [i,b] of blocks.entries()) for (const l of b[1].split('\n')) {
      const m=l.match(/^(.+?)\s*\|\s*score:\s*([\d.]+)\s*\|\s*95% CI:\s*\((-?[\d.]+),\s*(-?[\d.]+)\)\s*\|\s*average #tokens:\s*(\d+)/);
      if(m) rows.push({model:m[1].trim(),score:Number(m[2]),setting:i===0?'v0.1 style-controlled':'v0.1 original',tokens:Number(m[5]),metrics:{ciLow:Number(m[2])+Number(m[3]),ciHigh:Number(m[2])+Number(m[4])}});
    }
    if (!rows.length) throw new Error('No archived results');
    return rows;
  },
};
export default board;
