// HourVideo reports overall accuracy percentages for blind, Socratic and multimodal baselines. Handle the rowspan baseline label and preserve all eighteen task-category accuracies.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/keshik6/HourVideo/main/README.md";
const board: Leaderboard = {
  benchmark: "hourvideo", url: "https://raw.githubusercontent.com/keshik6/HourVideo/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.includes("Avg."));if(!t)throw new Error("Missing HourVideo baseline table");let harness="";for(const r of t.slice(2)){const hasBaseline=r.length===21;if(hasBaseline)harness=r[0];const model=r[hasBaseline?1:0];const values=r.slice(hasBaseline?2:1);const score=num(values.at(-1));if(score===undefined)continue;const metrics:Record<string,number>={};for(let i=0;i<t[1].length;i++){const n=num(values[i]);if(n!==undefined)metrics[t[1][i]]=n;}rows.push({model,score,harness,metrics});}
    if (!rows.length) throw new Error("No hourvideo score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

