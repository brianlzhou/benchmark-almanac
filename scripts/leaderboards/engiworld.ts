// EngiWorld: published overall EngiScore, on the 0–100 scale.
// CLI and GUI subset scores remain metrics. Overall API cost is per task;
// output tokens are per-turn means and stay metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://engiworld.github.io/assets/main_results.csv";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "engiworld",
  url: "https://engiworld.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at engiworld.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  chart:{title:'EngiScore versus API cost',x:{key:'cost',label:'Mean API cost per task',unit:'$',better:'lower'},y:{key:'score',label:'EngiScore',unit:'%',better:'higher'},note:'Overall evaluation across 306 tasks, including unsuccessful runs.'},
  async fetch() {
    const out:LeaderboardRow[]=[];
    for(const r of parseCsv(await fetchText(FEED))){if(!r.name)continue;for(const split of ['overall']){const score=num(r[split]);if(score===undefined)continue;const metrics:Record<string,number>={};if(split==='overall')for(const [k,v] of Object.entries(r)){if(k==='name'||k==='overall')continue;const n=num(v);if(n!==undefined)metrics[k==='tokens_k'?'outputTokensPerTurn':k]=k==='tokens_k'?n*1000:n;}
      out.push({model:identity(r.name),score,setting:split==='overall'?'Overall (306 tasks)':split==='cli'?'CLI (158 tasks)':'GUI (148 tasks)',cost:split==='overall'?num(r.cost):undefined,metrics});}}
    if(!out.length)throw new Error('EngiWorld results missing');return out;
  },
};
export default board;
