// STaRK: the board defaults to Synthesized (full), AMAZON, ranked by Hit@1 percentage.
// No cross-domain aggregate is published. Keep only this default view; Hit@5, recall and MRR remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text, jsLiteral } from '../lib/html.ts';
const FEED = "https://huggingface.co/spaces/snap-stanford/stark-leaderboard/resolve/main/app.py";
const board: Leaderboard = {
  benchmark: "stark", url: "https://huggingface.co/spaces/snap-stanford/stark-leaderboard", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    for(const [key,split] of [["data_synthesized_full","test"]]){const at=source.indexOf(key+" = ");if(at<0)throw new Error("Missing STaRK baseline "+key);const d=jsLiteral<any>(source,at+key.length+3);for(let i=0;i<d.Method.length;i++)for(const dataset of ["AMAZON"]){const score=d[`STARK-${dataset}_Hit@1`][i];rows.push({model:d.Method[i],score,metrics:{hit5:d[`STARK-${dataset}_Hit@5`][i],recall20:d[`STARK-${dataset}_R@20`][i],mrr:d[`STARK-${dataset}_MRR`][i]}});}}
    const base=FEED.replace(/app\.py$/,"");const tree=JSON.parse(await fetchText("https://huggingface.co/api/spaces/snap-stanford/stark-leaderboard/tree/main/submissions?recursive=true&limit=100"));
    for(const f of tree){if(!f.path.endsWith("/latest.json"))continue;const latest=JSON.parse(await fetchText(base+f.path));if(latest.status!=="approved")continue;const path=f.path.replace("latest.json",`metadata_${latest.latest_submission}.json`);const d=JSON.parse(await fetchText(base+path));if(d.Dataset.toUpperCase()!=="AMAZON"||d.Split!=="test")continue;const score=d.results?.["hit@1"];if(typeof score!=="number")continue;rows.push({model:d["Method Name"],score,metrics:{hit5:d.results["hit@5"],recall20:d.results["recall@20"],mrr:d.results.mrr}});}

    if (!rows.length) throw new Error("No stark score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

