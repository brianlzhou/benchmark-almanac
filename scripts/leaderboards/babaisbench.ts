// BabaIsBench Stage 0 publishes pass@1 over eight levels and three attempts each. The score is percent; total cost is divided by 24 attempts for task cost. The frontier preserves source total cost. Output tokens remain a reported metric because the table does not state their aggregation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://quesma.com/benchmarks/babaisbench/";
const board: Leaderboard = {
  benchmark: "babaisbench", url: "https://quesma.com/benchmarks/babaisbench/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  chart: {title:"Intro levels cost frontier",x:{key:"totalCost",label:"Total cost of 24 attempts",unit:"$",better:"lower",log:true},y:{key:"score",label:"pass@1",unit:"%",better:"higher"}},
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.some(c=>c.startsWith("pass@1")));if(!t)throw new Error("Missing Stage 0 table");
    const h=t[0],ix=(prefix:string)=>h.findIndex(c=>c.startsWith(prefix));
    for(const r of t.slice(1)){const score=num(r[ix("pass@1")]),total=num(r[ix("Total cost")]);if(score===undefined)continue;
      const tokenCell=r[ix("Output tokens")],n=num(tokenCell),reported=n===undefined?undefined:n*(/M/i.test(tokenCell)?1e6:/k/i.test(tokenCell)?1e3:1);
      rows.push({model:r[0].replace(/^(OpenAI|Google|Anthropic|DeepSeek|Alibaba|Moonshot|Zhipu|MiniMax|xAI|Z\.ai|Kimi|Grok|Qwen|Hunyuan|Meta)\s+/i,""),score,setting:"Stage 0; 8 levels; 3 attempts",cost:total===undefined?undefined:total/24,metrics:{pass3:num(r[ix("pass@3")])!,turns:num(r[ix("Turns")])!,reportedOutputTokens:reported!,totalCost:total!}});
    }
    if (!rows.length) throw new Error("No babaisbench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

