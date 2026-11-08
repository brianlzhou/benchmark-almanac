// Video-Oasis: use Overall accuracy from the main video-native challenge table.
// Diagnostic grounding, shortcut, oracle and training studies are not additional leaderboard settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://limgeuntaekk.github.io/Video-Oasis/";
const board: Leaderboard = {
  benchmark: "video-oasis", url: "https://limgeuntaekk.github.io/Video-Oasis/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    for(let ti=0;ti<Math.min(1,all.length);ti++){const t=all[ti],h=t[0];if(!h)continue;let paradigm="";for(const r of t.slice(1)){if(r.length<2)continue;let model=r[0],score:number|undefined,setting="",metrics:Record<string,number>={};if(ti===0){score=num(r[6]);setting="";for(let i=1;i<6;i++)metrics[h[i]]=num(r[i])!;}else if(ti===1){score=num(r[2]);setting=`Grounding ablation; ${r[1]==="&check;"?"grounding":"no grounding"}`;}else if(ti===2){score=num(r[1]);setting="Shortcut ablation";metrics.shortcut=num(r[2])!;}else if(ti===3){score=num(r[1]);setting="Agentic ablation";}else if(ti===4){if(r.length===4)paradigm=r[0];const offset=r.length===4?1:0;model=r[offset];score=num(r[offset+2]);setting=`Training ablation; ${paradigm}; reward ${r[offset+1]}`;}if(score!==undefined)rows.push({model,score,setting,metrics});}}
    if (!rows.length) throw new Error("No video-oasis score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

