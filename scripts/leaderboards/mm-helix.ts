// MM-HELIX reports separate text and image task accuracy percentages. Preserve both overall modalities, the thinking flag, and four category accuracies.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://mm-helix.github.io/";
const board: Leaderboard = {
  benchmark: "mm-helix", url: "https://mm-helix.github.io/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.includes("Thinking"));if(!t)throw new Error("Missing MM-HELIX table");for(const r of t){if(r.length!==12)continue;for(const [offset,modality] of [[0,"Text"],[1,"Image"]] as const){const score=num(r[10+offset]);if(score===undefined)continue;rows.push({model:r[0],score,setting:`${modality}; ${r[1]==="✓"?"thinking":"non-thinking"}`,metrics:{Puzzles:num(r[2+offset])!,Games:num(r[4+offset])!,Algorithms:num(r[6+offset])!,Graphs:num(r[8+offset])!}});}}
    if (!rows.length) throw new Error("No mm-helix score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

