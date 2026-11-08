// Factory publishes Legacy-Bench pass@1 percentages, USD per task and duration. Read the permitted Factory table and preserve its cost frontier without requesting the restricted mirror.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://factory.com/news/legacy-bench-specialized-intelligence-index";
const board: Leaderboard = {
  benchmark: "legacy-bench", url: "https://factory.com/news/legacy-bench-specialized-intelligence-index", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  chart: {title:"Legacy-Bench score versus cost per task",x:{key:"cost",label:"Cost per task",unit:"$",better:"lower"},y:{key:"score",label:"Pass@1",unit:"%",better:"higher"}},
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.join("|")==="Model|Score|Cost|Duration");if(!t)throw new Error("Missing Legacy-Bench results");for(const r of t.slice(1)){const score=num(r[1]),cost=num(r[2]);if(score===undefined)continue;const m=r[3].match(/(?:(\d+)m)?\s*(\d+)s/);const metrics:Record<string,number>={};if(cost!==undefined)metrics.cost=cost;if(m)metrics.latency=Number(m[1]??0)*60+Number(m[2]);rows.push({model:r[0],score,cost,metrics});}
    if (!rows.length) throw new Error("No legacy-bench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

