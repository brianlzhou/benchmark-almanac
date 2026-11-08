// VCR-Bench: Avg is video chain-of-thought reasoning accuracy in percent. Keep the seven reasoning-category accuracies and retain ambiguous undated snapshot names as unlisted entries.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://vlm-reasoning.github.io/VCR-Bench/";
const board: Leaderboard = {
  benchmark: "vcr-bench", url: "https://vlm-reasoning.github.io/VCR-Bench/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].includes("FTR")&&t[0].includes("Avg"));if(!table)throw new Error("Missing VCR-Bench table");
    for(const r of table.slice(1)){const score=num(r[9]);if(score===undefined)continue;rows.push({model:r[1].replace(/[🥇🥈🥉]/gu,"").trim(),score,metrics:Object.fromEntries(table[0].slice(2,9).flatMap((h,j)=>{const n=num(r[j+2]);return n===undefined?[]:[[h,n]];}))});}
    if (!rows.length) throw new Error("No vcr-bench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

