// EvalCrafter ranks video models by Final Sum Score, the sum of four learned quality scores. Model-version dates belong to model identities, not benchmark settings; preserve each component and do not equate this native score to a percentage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://evalcrafter.github.io/";
const board: Leaderboard = {
  benchmark: "evalcrafter", parts: {
  'Visual Quality': { name: 'Visual quality', group: 'Dimension' },
  'Text-Video Alignment': { name: 'Text to video alignment', group: 'Dimension' },
  'Motion Quality': { name: 'Motion quality', group: 'Dimension' },
  'Temporal Consistency': { name: 'Temporal consistency', group: 'Dimension' },
}, url: "https://evalcrafter.github.io/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const speed = all.find(t => t[0]?.includes('Generation Speed'));
    const timing = new Map((speed?.slice(1) ?? []).map(r => [`${r[0].toLowerCase()}|${r[1].replace(/^20/, '')}`, r[7]]));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.includes("Final Sum Score"));if(!t)throw new Error("Missing EvalCrafter table");for(const r of t.slice(1)){const score=num(r[6]);if(score===undefined)continue;const metrics:Record<string,number>={};for(let i=2;i<6;i++)metrics[t[0][i]]=num(r[i])!;const duration=timing.get(`${r[0].toLowerCase()}|${r[1].replace(/^20/, '')}`)?.match(/^(\d+(?:\.\d+)?)\s*(min|s)$/);if(duration)metrics[duration[2]==='min'?'minutes':'time']=Number(duration[1]);rows.push({model:`${r[0]} (${r[1]})`,score,metrics});}
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

