// X Browse: the Grok 4.1 Fast launch table reports success percentages and average dollar cost per task. Use only X Browse columns, preserving the Agent Tools API harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://x.ai/news/grok-4-1-fast";
const board: Leaderboard = {
  benchmark: "x-browse-xai", url: "https://x.ai/news/grok-4-1-fast", feed: FEED,
  terms: "Public xAI launch article under xAI site terms; only the permitted x.ai page is read.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].some(h=>/^X Browse/.test(h)));if(!table)throw new Error("Missing X Browse results");
    for(const r of table.slice(2)){if(r.length!==7)continue;const score=num(r[5]);if(score===undefined)continue;rows.push({model:r[0].replace(/ Agent Tools API$/,""),score,cost:num(r[6]),harness:r[0].endsWith("Agent Tools API")?"Agent Tools API":undefined});}
    if (!rows.length) throw new Error("No x-browse-xai score rows");
    return rows;
  },
};
export default board;
