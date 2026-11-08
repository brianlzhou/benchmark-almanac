// xMMMU: published multilingual accuracy across the translated question set.
// The English reference is a supporting metric, not another xMMMU headline row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://neulab.github.io/Pangea/";
const board: Leaderboard = {
  benchmark: "xmmmu", url: "https://neulab.github.io/Pangea/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[1]?.includes("xMMMU"));if(!t)throw new Error("Missing xMMMU header");
    const index=1+2*t[1].indexOf("xMMMU");
    for(const r of t.slice(3))for(const [offset,setting] of [[0,"English"],[1,"multilingual"]] as const){const score=num(r[index+offset]);if(!/^Δ/.test(r[0])&&r.length>index+offset&&score!==undefined)rows.push({model:r[0],score,setting});}
    if (!rows.length) throw new Error("No xmmmu score rows");
    return rows.filter(r=>r.setting==='multilingual').map(r=>{
      const english=rows.find(x=>x.model===r.model&&x.setting==='English');
      return {...r,setting:undefined,metrics:english?{english:english.score}:undefined};
    });
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

