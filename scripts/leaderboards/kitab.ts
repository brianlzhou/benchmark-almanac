// KITAB: All Correct is the fraction of fully correct answers, converted to percent. Each model has no-context, self-context and with-context runs, retaining completeness and relevance metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://huggingface.co/datasets/microsoft/kitab/resolve/main/README.md";
const board: Leaderboard = {
  benchmark: "kitab", url: "https://huggingface.co/datasets/microsoft/kitab", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].some(h=>h.startsWith("All Correct")));if(!table)throw new Error("Missing KITAB results");
    for(const r of table.slice(2))for(const [i,setting] of ["NO-CONTEXT","SELF-CONTEXT","WITH-CONTEXT"].entries()){if(r.length!==16)throw new Error("KITAB schema changed");const score=num(r[13+i]);if(score===undefined)continue;rows.push({model:r[0],score:score*100,setting,metrics:Object.fromEntries([["irrelevant",1],["satisfied",4],["unsatisfied",7],["completeness",10]].flatMap(([h,j])=>{const v=num(r[Number(j)+i]);return v===undefined?[]:[[h,v*100]];}))});}
    if (!rows.length) throw new Error("No kitab score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;
