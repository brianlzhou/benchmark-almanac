// ScreenSpot: Average GUI-grounding accuracy is the headline percentage in the SeeClick README.
// Mobile, desktop and web text/icon accuracies remain diagnostic metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/njucckevin/SeeClick/main/readme.md";
const board: Leaderboard = {
 benchmark: "screenspot",
 url: "https://github.com/njucckevin/SeeClick",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Mobile Text'));
  if (!t) throw new Error('screenspot table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[9])!==undefined).map(r=>({
    model:r[0]==='GPT-4V' ? r[0]+' (snapshot unspecified)' : r[0], score:num(r[9])!*1, 
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==9 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('screenspot has no scored rows');
  return rows;
 },
};
export default board;
