// LVOmniBench: Avg. is the reported percentage accuracy. Preserve audio/video modality settings and difficulty/reasoning breakdowns, removing commented-out affiliation markup from model names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://kd-tao.github.io/LVOmniBench/";
const board: Leaderboard = {
  benchmark: "lvomnibench", url: "https://kd-tao.github.io/LVOmniBench/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].includes("Modality")&&t[0].includes("Avg."));if(!table)throw new Error("Missing LVOmniBench table");
    for(const r of table.slice(1)){const score=num(r[10]);if(score===undefined)continue;rows.push({model:r[1],score,setting:r[2],metrics:Object.fromEntries(table[0].slice(3,10).flatMap((h,j)=>{const n=num(r[j+3]);return n===undefined?[]:[[h,n]];}))});}
    if (!rows.length) throw new Error("No lvomnibench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

