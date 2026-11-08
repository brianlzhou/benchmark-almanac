// Ko-GDPval: the Solar Pro 4 launch article reports two model pass percentages. Read only the Ko-GDPval row, ignoring repeated responsive copies and token pricing from unrelated tables.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://www.upstage.ai/blog/en/solar-pro-4";
const board: Leaderboard = {
  benchmark: "ko-gdpval-upstage", url: "https://www.upstage.ai/blog/en/solar-pro-4", feed: FEED,
  terms: "Public Upstage launch article, with benchmark results attributed to Upstage and subject to site terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].includes("Solar Pro 4"));const r=table?.find(r=>r.some(c=>/^Ko-GDPval/.test(c)));if(!r||!table)throw new Error("Missing Ko-GDPval row");
    for(let i=0;i<2;i++){const score=num(r[r.length-3+i]);if(score!==undefined)rows.push({model:table[0][i+2],score});}
    if (!rows.length) throw new Error("No ko-gdpval-upstage score rows");
    return rows;
  },
};
export default board;
