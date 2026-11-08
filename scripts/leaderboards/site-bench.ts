// SITE-Bench reports spatial reasoning accuracy in percent. Exclude the Tiny Subset and retain category accuracies on full-benchmark rows. Human and random references are not model results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://wenqi-wang20.github.io/SITE-Bench.github.io/";
const board: Leaderboard = {
  benchmark: "site-bench", url: "https://wenqi-wang20.github.io/SITE-Bench.github.io/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.[1]==="Overall"); if(!t)throw new Error("Missing SITE table");
    let setting="full";
    for(const r of t.slice(1)) {if(r.length===1){setting=r[0]==="Tiny Subset"?"Tiny Subset":"full";continue;}
      if(setting!=="full")continue;
      const score=num(r[1]);if(score===undefined||/^(Human|Random)$/.test(r[0]))continue;
      rows.push({model:r[0],score,metrics:Object.fromEntries(t[0].slice(2).flatMap((h,j)=>{const n=num(r[j+2]);return n===undefined?[]:[[h,n]];}))});
    }
    if (!rows.length) throw new Error("No site-bench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

