// EvoArena defines three dynamic benchmark task sets. Step accuracy is the first headline measure; chain accuracy is auxiliary. Static control benchmarks are excluded.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { tables, num, text } from '../html.ts';
const FEED = "https://aiden0526.github.io/EvoArena/";
const board: Leaderboard = {
  benchmark: "evoarena", url: "https://aiden0526.github.io/EvoArena/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    for(const t of all){const chain=t[0]?.includes("Chain Base");if(!t[0]?.includes("Benchmark"))continue;let benchmark="",harness="";for(const r of t.slice(1)){const width=chain?9:6,offset=r.length===width?2:0;if(offset){benchmark=r[0];harness=r[1];}const model=r[offset];if(model==="Average")continue;for(const [j,label] of (chain?[[1,"Step; Base"],[2,"Step; EvoMem"],[4,"Chain; Base"],[5,"Chain; EvoMem"]]:[[1,"Base"],[2,"EvoMem"]]) as [number,string][]){const score=num(r[offset+j]);if(score!==undefined)rows.push({model,score,harness,setting:`${benchmark}; ${label}`,metrics:chain&&label.startsWith("Step;")?{chainAccuracy:num(r[offset+(label.endsWith("EvoMem")?5:4)])!}:undefined});}}}
    if (!rows.length) throw new Error("No evoarena score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export const sourceBoard = board;


// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
