// GEdit-Bench: G_O is the overall image-editing quality score, distinct from Kris-Bench. Preserve G_SC semantic consistency and G_PQ perceptual quality, including thinking/reflection variants.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/stepfun-ai/Step1X-Edit/main/README.md";
const board: Leaderboard = {
  benchmark: "gedit-bench", url: "https://raw.githubusercontent.com/stepfun-ai/Step1X-Edit/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].includes("GEdit-Bench"));if(!table)throw new Error("Missing GEdit-Bench results");
    for(const r of table.slice(2)){const score=num(r[3]);if(score===undefined)continue;const m=r[0].match(/^(.*?)\s*\((thinking[^)]*)\)$/i);rows.push({model:m?m[1]:r[0],score,setting:m?.[2],metrics:{semanticConsistency:num(r[1])!,perceptualQuality:num(r[2])!}});}
    for(const t of markdownTables(source)){
      if(!t[0].some(c=>c.startsWith('G_O')))continue;
      for(const r of t.slice(1)){
        const score=num(r[3]);if(score===undefined)continue;
        const model=r[0].replace(/Step1X-Edit \(v([\d.]+)\)/i,'Step1X-Edit v$1');
        const same=rows.find(x=>x.model.toLowerCase()===model.toLowerCase()&&Math.abs(x.score-score)<0.001);
        const metrics={semanticConsistency:num(r[1])!,perceptualQuality:num(r[2])!,qwenOverall:num(r[6])!};
        if(same)same.metrics={...same.metrics,...metrics};else rows.push({model,score,metrics});
      }
    }
    if (!rows.length) throw new Error("No gedit-bench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

