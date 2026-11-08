// MeViS: use Val-u J&F, the public-label evaluation split named in this benchmark record.
// Val J&F remains a secondary metric, alongside the Val-u J and F scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/henghuiding/MeViS/main/README.md";
const board: Leaderboard = {
  benchmark: "mevis", url: "https://raw.githubusercontent.com/henghuiding/MeViS/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.[0]==="Backbone");if(!t)throw new Error("Missing MeViS results");for(const r of t.slice(2))for(let j=0;j<2;j++){const i=1+3*j,score=num(r[i]);if(score===undefined)continue;rows.push({model:r[0],score,setting:j===0?"Val-u":"Val",metrics:{J:num(r[i+1])!,F:num(r[i+2])!}});}
    if (!rows.length) throw new Error("No mevis score rows");
    return rows.filter(r => r.setting==='Val-u').map(r => {
      const val=rows.find(x => x.model===r.model && x.setting==='Val');
      return {...r,setting:undefined,metrics:{...r.metrics,...(val ? {val:val.score} : {})}};
    });
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

