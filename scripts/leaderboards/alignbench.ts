// AlignBench v1.1: Overall is the reported score on a ten-point scale, not a percentage. Preserve reasoning and language dimension scores from the current repository README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/THUDM/AlignBench/master/README.md";
const board: Leaderboard = {
  benchmark: "alignbench", url: "https://github.com/THUDM/AlignBench", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].some(h=>h.includes("AlignBench v1.1"))); if(!table)throw new Error("Missing v1.1 table");
    for(const r of table.slice(3)){const score=num(r[1]);if(!r[0]||score===undefined)continue;rows.push({model:r[0],score,setting:"v1.1",metrics:Object.fromEntries(table[2].slice(1).flatMap((h,j)=>{const v=num(r[j+2]);return v===undefined?[]:[[h,v]];}))});}
    if (!rows.length) throw new Error("No alignbench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;
