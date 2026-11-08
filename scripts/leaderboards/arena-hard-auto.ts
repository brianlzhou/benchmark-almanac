// Arena-Hard v0.1's archived rankings, read from the maintained repository's main branch. The first
// console block gives style-controlled win rates. The second gives original v0.1 win rates, used as the score.
// Style-controlled win rate remains a secondary metric. Tokens and intervals belong to the original ranking.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/Arena-OSS/arena-hard-auto/main/misc/past_leaderboards.md';
const board: Leaderboard = {
  benchmark: 'arena-hard-auto', url: 'https://github.com/Arena-OSS/arena-hard-auto', feed: FEED,
  terms: 'The official Arena-OSS/arena-hard-auto repository publishes these archived results under its repository license.',
  aliases:{'claude-3-5-sonnet-20240620':'claude-3-5-sonnet','claude-3-5-sonnet-20241022':'claude-3-5-sonnet-october-2024','gemini-1.5-flash-api-0514':'gemini-1-5-flash-may-2024','gemini-1.5-pro-api-0514':'gemini-1-5-pro-may-2024'},
  async fetch() {
    const md = await fetchText(FEED);
    const blocks = [...md.matchAll(/```console\s*([\s\S]*?)```/g)];
    if (blocks.length !== 2) throw new Error('Expected two v0.1 ranking blocks');
    const rows: LeaderboardRow[] = [];
    for (const [i,b] of blocks.entries()) for (const l of b[1].split('\n')) {
      const m=l.match(/^(.+?)\s*\|\s*score:\s*([\d.]+)\s*\|\s*95% CI:\s*\((-?[\d.]+),\s*(-?[\d.]+)\)\s*\|\s*average #tokens:\s*(\d+)/);
      if(m) rows.push({model:/^(gemini-1[.]5-(?:flash|pro)-api-preview|gemini-pro|command-r(?:-plus)?|mistral-7b-instruct)$/i.test(m[1].trim())?m[1].trim()+' [snapshot unspecified]':m[1].trim(),score:Number(m[2]),setting:i===0?'v0.1 style-controlled':'v0.1 original',tokens:Number(m[5]),metrics:{ciLow:Number(m[2])+Number(m[3]),ciHigh:Number(m[2])+Number(m[4])}});
    }
    if (!rows.length) throw new Error('No archived results');
    return rows.filter(r => r.setting === 'v0.1 original').map(r => {
      const controlled = rows.find(x => x.model.toLowerCase() === r.model.toLowerCase() && x.setting === 'v0.1 style-controlled');
      return {...r, setting: undefined, metrics: {...r.metrics, ...(controlled ? {styleControlledWinRate: controlled.score} : {})}};
    });
  },
};
export default board;
