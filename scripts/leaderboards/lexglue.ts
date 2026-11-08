// LexGLUE: published harmonic mean micro-F1 across all seven tasks, in percent.
// The README favors harmonic averaging to alleviate differing task complexity and sample counts.
// Other published averaging methods and macro-F1 remain metrics; incomplete task-only models are omitted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/coastalcph/lex-glue/main/README.md";
const board: Leaderboard = {
  benchmark: "lexglue", url: "https://github.com/coastalcph/lex-glue", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const fixed=source.replace(/<\/td>\s*<tr>/g,"</td></tr><tr>").replace("<b>54.4</b><td>","<b>54.4</b></td><td>");const ts=tables(fixed).map(t=>t.map(r=>r.map(c=>c.text)));let taskTable=0;
    for(const t of ts){const avg=t[0]?.[0]==="Averaging",task=t[0]?.[0]==="Dataset"&&t[0]?.includes("CaseHOLD");if(!avg&&!task)continue;if(task)taskTable++;for(const r of t.slice(2)){if(r.length!==t[0].length)continue;for(let i=1;i<r.length;i++){const parts=r[i].split("/");const score=num(parts[0]);if(score===undefined)continue;const macro=num(parts[1]);rows.push({model:r[0],score,setting:avg?`${t[0][i]} mean; micro-F1`:`${t[0][i]}; ${taskTable===3?"small-sized":"standard"}; micro-F1`,metrics:macro===undefined?undefined:{macroF1:macro}});}}}
    if (!rows.length) throw new Error("No lexglue score rows");
    return rows.filter(r=>r.setting==='Harmonic mean; micro-F1').map(r=>({...r,setting:undefined,
      metrics:{...r.metrics,...Object.fromEntries(rows.filter(x=>x.model===r.model&&/^(Arithmetic|Geometric) mean/.test(x.setting??'')).flatMap(x=>{
        const key=x.setting!.split(' ')[0].toLowerCase();return [[key+'_microF1',x.score],...(x.metrics?.macroF1===undefined?[]:[[key+'_macroF1',x.metrics.macroF1]])];
      }))}}));
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

