// EvalCrafter ranks video models by Final Sum Score, the sum of four learned quality scores. Model-version dates belong to model identities, not benchmark settings; preserve each component and do not equate this native score to a percentage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://evalcrafter.github.io/";
const board: Leaderboard = {
  benchmark: "evalcrafter", url: "https://evalcrafter.github.io/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.includes("Final Sum Score"));if(!t)throw new Error("Missing EvalCrafter table");for(const r of t.slice(1)){const score=num(r[6]);if(score===undefined)continue;const metrics:Record<string,number>={};for(let i=2;i<6;i++)metrics[t[0][i]]=num(r[i])!;rows.push({model:`${r[0]} (${r[1]})`,score,metrics});}
    if (!rows.length) throw new Error("No evalcrafter score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

