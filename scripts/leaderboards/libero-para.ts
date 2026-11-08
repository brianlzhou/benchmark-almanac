// LIBERO-Para reports paraphrase success rate as a percentage. Preserve policy training variants and join PRIDE, baseline success and failure-mode metrics by exact source name.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://cau-hai-lab.github.io/LIBERO-Para/";
const board: Leaderboard = {
  benchmark: "libero-para", url: "https://cau-hai-lab.github.io/LIBERO-Para/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.includes("LIBERO-Para SR"));if(!t)throw new Error("Missing success table");for(const r of t.slice(1)){const score=num(r[2]);if(score===undefined)continue;const metrics:Record<string,number>={goalSuccess:num(r[1])!,drop:num(r[3])!};for(const other of all.filter(x=>x!==t)){const v=other.slice(1).find(x=>x[0]===r[0]);if(v)for(let i=2;i<v.length;i++){const n=num(v[i]);if(n!==undefined)metrics[other[0][i]]=n;}}rows.push({model:r[0].replace(/&pi;\s*/g,"π"),score,setting:"LIBERO-Para",metrics});}
    if (!rows.length) throw new Error("No libero-para score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

