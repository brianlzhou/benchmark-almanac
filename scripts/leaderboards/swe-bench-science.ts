// SWE-bench Science publishes overall pass@1 on 119 tasks and a HARD70 subset. Page data contains mean input/output tokens in millions per full-benchmark task. The score is full-set pass@1; HARD70 is a secondary metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text, jsonAfter } from '../lib/html.ts';
const FEED = "https://swescience.github.io/";
const board: Leaderboard = {
  benchmark: "swe-bench-science", url: "https://swescience.github.io/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  chart:{title:"Pass@1 versus output tokens",x:{key:"outputTokens",label:"Mean output tokens per task",better:"lower",log:true},y:{key:"score",label:"Overall Pass@1",unit:"%",better:"higher"}},
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const payload=[...source.matchAll(/self\.__next_f\.push\((\[1,.*?\])\)<\/script>/g)].map(m=>JSON.parse(m[1])[1]).join("");const d=jsonAfter<any>(payload,'"data":');for(const r of d.models){rows.push({model:r.family,score:r.scores.overall,harness:r.harness,setting:r.reasoningDepth,tokens:r.tokens.output*1e6,metrics:{...r.scores,inputTokens:r.tokens.input*1e6,outputTokens:r.tokens.output*1e6}});}const t=all.find(t=>t[0]?.includes("Pass@1"));if(t)for(const r of t.slice(1)){const score=num(r[3]);if(score===undefined)continue;const m=r[1].match(/^(.*?) \(([^)]+)\)$/);const row=rows.find(x=>x.model===(m?m[1]:r[1])&&x.harness===r[2]&&x.setting===(m?.[2]??"default"));if(row)row.metrics={...row.metrics,hard70:score};}
    if (!rows.length) throw new Error("No swe-bench-science score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

