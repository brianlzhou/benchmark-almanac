// Claw-SWE-Bench Full-350 reports pass@1 in percent. Divide full-run USD and output-token totals by the instance count; separate single runs from three-run means and do not join historical per-language scores to those means.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
const FEED = "https://claw-swe-bench.github.io/";
const board: Leaderboard = {
  benchmark: "claw-swe-bench", harnesses: 'system', reference: ['OpenClaw'], url: "https://claw-swe-bench.github.io/", feed: FEED,
  parts: {
    Java: { name: 'Java', group: 'Language' },
    Go: { name: 'Go', group: 'Language' },
    Rust: { name: 'Rust', group: 'Language' },
    'JS/TS': { name: 'JS/TS', group: 'Language' },
    'C/C++': { name: 'C/C++', group: 'Language' },
    Ruby: { name: 'Ruby', group: 'Language' },
    PHP: { name: 'PHP', group: 'Language' },
    Python: { name: 'Python', group: 'Language' },
  },
  stats: {
    resolved: { name: 'Resolved instances', unit: 'count', better: 'higher' },
    instances: { name: 'Instances evaluated', unit: 'count' },
    cost_usd: { name: 'Total API cost', unit: 'usd', better: 'lower' },
    inputTokens: { name: 'Input tokens per task', unit: 'tokens', better: 'lower' },
    avg_duration_s: { name: 'Average duration per task', unit: 'seconds', better: 'lower' },
    avg_turns: { name: 'Average turns per task', unit: 'count', better: 'lower' },
    cache_hit: { name: 'Cache hit rate', unit: '%', better: 'higher' },
    time: { name: 'Average duration per submission', unit: 'seconds', better: 'lower' },
    turns: { name: 'Average turns per submission', unit: 'count', better: 'lower' },
  },
  terms: "Public official results, subject to the source repository license and host terms.",
  chart:{title:"Cost–Resolve Pareto",x:{key:"cost_usd",label:"Total API cost for Full-350",unit:"$",better:"lower",log:true},y:{key:"score",label:"Total Pass@1",unit:"%",better:"higher"}},
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const raw=source.match(/<script[^>]*id="data"[^>]*>([\s\S]*?)<\/script>/)?.[1];if(!raw)throw new Error("Missing Claw data");const d=JSON.parse(raw);
    const add=(r:any,model:string,harness:string,mode:string,agent=false)=>{if(typeof r.total_pass1!=="number")return;const n=r.instances;const cost=typeof r.cost_usd==="number"&&n>0?r.cost_usd/n:undefined;const tokens=typeof r.output_tokens_m==="number"&&n>0?r.output_tokens_m*1e6/n:undefined;const metrics:Record<string,number>={};for(const k of ["resolved","instances","avg_duration_s","avg_turns","cache_hit","cost_usd"])if(typeof r[k]==="number")metrics[k]=r[k];if(typeof r.input_tokens_m==="number"&&n>0)metrics.inputTokens=r.input_tokens_m*1e6/n;if(!/historical/i.test(r.per_language_source??""))Object.assign(metrics,r.per_language);if(typeof r.avg_duration_s==="number")metrics.time=r.avg_duration_s;if(typeof r.avg_turns==="number")metrics.turns=r.avg_turns;rows.push({model,trials:typeof r.runs==='number'&&r.runs>0?r.runs:undefined,open:!agent&&typeof r.open_weights==='boolean'?r.open_weights:undefined,agentOrg:agent?r.org||undefined:undefined,score:r.total_pass1,harness,setting:`${d.meta.split}; ${mode}`,cost,tokens,metrics});};
    for(const r of d.sections.openclaw.rows)add(r,r.system,"OpenClaw","single run");for(const g of d.sections.claws.groups)for(const r of g.rows)add(r,g.model,r.system,`mean of ${r.runs??3} runs`,true);
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

