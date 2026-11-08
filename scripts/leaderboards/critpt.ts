// CritPt v2: Challenge Accuracy is the published percentage of physics challenges solved.
// The version label prevents these scores from being confused with the original benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/CritPt-Benchmark/CritPt/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "critpt",
 url: "https://github.com/CritPt-Benchmark/CritPt",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].some(h=>h.startsWith('Challenge Accuracy')));
  if (!t) throw new Error('critpt table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[1])!==undefined).map(r=>({
    model:r[0], score:num(r[1])!*1, setting:"v2",
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==1 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('critpt has no scored rows');
  return rows;
 },
};
export default board;
