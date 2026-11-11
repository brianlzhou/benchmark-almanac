// FormalMATH reports Lite proof success in percent at published sampling budgets. The full set is excluded. Ignore commented template columns and repair one malformed closing cell in the source.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://sphere-ai-lab.github.io/FormalMATH/";
const board: Leaderboard = {
  benchmark: "formalmath-lite", url: "https://sphere-ai-lab.github.io/FormalMATH/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const clean=source.replace(/<!--[\s\S]*?-->/g, "").replace(/<\/13td>/g,"</td>");
    const boards=tables(clean).map(t=>t.map(r=>r.map(c=>c.text))).filter(t=>t[0]?.includes("Sampling Budget"));
    if(boards.length!==2)throw new Error("Expected full and Lite tables");
    boards.slice(1,2).forEach((t,k)=>{for(const r of t.slice(1)){const score=num(r[4]),budget=r[3];if(score===undefined||!budget)continue;
      const model=(r[0].includes(r[1])?r[0]:r[0]+"-"+r[1]).replace(/^DeepSeek-V/,'DeepSeek-Prover-V');rows.push({model,score,setting:"sampling budget "+budget,metrics:/^\d+$/.test(budget)?{samplingBudget:Number(budget)}:undefined});
    }});
    if (!rows.length) throw new Error("No formalmath score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

