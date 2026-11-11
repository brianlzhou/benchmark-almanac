// Claw-SWE-Bench Full-350 reports pass@1 in percent. Divide full-run USD and output-token totals by the instance count; separate single runs from three-run means and do not join historical per-language scores to those means.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
const FEED = "https://claw-swe-bench.github.io/";
const board: Leaderboard = {
  benchmark: "claw-swe-bench", url: "https://claw-swe-bench.github.io/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  chart:{title:"Cost–Resolve Pareto",x:{key:"cost_usd",label:"Total API cost for Full-350",unit:"$",better:"lower",log:true},y:{key:"score",label:"Total Pass@1",unit:"%",better:"higher"}},
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const raw=source.match(/<script[^>]*id="data"[^>]*>([\s\S]*?)<\/script>/)?.[1];if(!raw)throw new Error("Missing Claw data");const d=JSON.parse(raw);
    const add=(r:any,model:string,harness:string,mode:string)=>{if(typeof r.total_pass1!=="number")return;const n=r.instances;const cost=typeof r.cost_usd==="number"&&n>0?r.cost_usd/n:undefined;const tokens=typeof r.output_tokens_m==="number"&&n>0?r.output_tokens_m*1e6/n:undefined;const metrics:Record<string,number>={};for(const k of ["avg_duration_s","avg_turns","cache_hit","cost_usd"])if(typeof r[k]==="number")metrics[k]=r[k];if(!/historical/i.test(r.per_language_source??""))Object.assign(metrics,r.per_language);rows.push({model,score:r.total_pass1,harness,setting:`${d.meta.split}; ${mode}`,cost,tokens,metrics});};
    for(const r of d.sections.openclaw.rows)add(r,r.system,"OpenClaw","single run");for(const g of d.sections.claws.groups)for(const r of g.rows)add(r,g.model,r.system,`mean of ${r.runs??3} runs`);
    if (!rows.length) throw new Error("No claw-swe-bench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

