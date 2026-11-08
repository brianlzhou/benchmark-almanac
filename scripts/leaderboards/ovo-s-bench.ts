// OVO-S-Bench reports streaming-video accuracy in percent. Preserve model size in the model identity, four difficulty metrics, and the text-only input control; exclude human and random references.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://internlm.github.io/OVO-S-Bench/";
const board: Leaderboard = {
  benchmark: "ovo-s-bench", url: "https://internlm.github.io/OVO-S-Bench/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.includes("L4")&&t[0]?.includes("Overall"));if(!t)throw new Error("Missing OVO-S table");let group="";
    for(const r of t.slice(1)){if(r.length===1){group=r[0];continue;}const score=num(r[6]);if(score===undefined||/^(Random|Human)/i.test(r[0]))continue;
    let model=r[0];const control=model.match(/^Text-Only \((.+)\)$/);if(control)model=control[1];else if(/^\d/.test(r[1])&&!model.includes(r[1]))model+="-"+r[1];rows.push({model,score,setting:control?"text-only":undefined,metrics:{L1:num(r[2])!,L2:num(r[3])!,L3:num(r[4])!,L4:num(r[5])!}}); }
    if (!rows.length) throw new Error("No ovo-s-bench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

