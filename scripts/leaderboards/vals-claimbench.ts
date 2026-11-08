// ClaimBench publishes claim-classification accuracy, USD per claim and latency. Read the main decision-system table and retain its five category scores without inferring product-to-model mappings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://www.vals.ai/benchmarks/claimbench";
const board: Leaderboard = {
  benchmark: "vals-claimbench", url: "https://www.vals.ai/benchmarks/claimbench", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.includes("Cost / Claim"));if(!t)throw new Error("Missing ClaimBench table");const cats=all.find(t=>t[0]?.includes("Direct support"));for(const r of t.slice(1)){const score=num(r[2]);if(score===undefined)continue;const metrics:Record<string,number>={latency:num(r[4])!};const c=cats?.find(x=>x[0]===r[1]);if(c&&cats)for(let i=1;i<c.length;i++){const n=num(c[i]);if(n!==undefined)metrics[cats[0][i]]=n;}rows.push({model:r[1],score,cost:num(r[3]),metrics});}
    if (!rows.length) throw new Error("No vals-claimbench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

