// Original SEC-bench declares data-default-leaderboard="poc_generation".
// Use that view’s published success percentage; matching vulnerability-patching
// scores remain metrics. SEC-bench Pro is a different benchmark record.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://sec-bench.github.io/";
const board: Leaderboard = {
  benchmark: "sec-bench", url: "https://sec-bench.github.io/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const ts=all.filter(t=>t[0]?.includes("System")&&t[0]?.includes("Score"));if(ts.length!==2)throw new Error("Expected original SEC-bench task tables");for(const [j,t] of ts.entries())for(const r of t.slice(1)){const score=num(r[2]);if(score===undefined)continue;const parts=r[1].replace(/\s+Verified$/,"").split(" + ");rows.push({model:parts.slice(1).join(" + "),harness:parts[0],score,setting:j===0?"PoC generation":"vulnerability patching",date:r[4]});}
    if (!rows.length) throw new Error("No sec-bench score rows");
    return rows.filter(r=>r.setting==='PoC generation').map(r=>{
      const patch=rows.find(x=>x.model===r.model&&x.harness===r.harness&&x.setting==='vulnerability patching');
      return {...r,metrics:patch?{patching:patch.score}:undefined};
    });
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

