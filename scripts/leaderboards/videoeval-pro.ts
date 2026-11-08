// VideoEval-Pro: use overall open-ended accuracy, the benchmark this record describes.
// MCQ accuracy is a secondary metric on the same frame-budget run. Keep LP/LR/HP/HR breakdowns.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://tiger-ai-lab.github.io/VideoEval-Pro/home_page.html";
const board: Leaderboard = {
  benchmark: "videoeval-pro", url: "https://tiger-ai-lab.github.io/VideoEval-Pro/home_page.html", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].includes("Overall (%)"));if(!table)throw new Error("Missing VideoEval-Pro table");
    for(const r of table.slice(2))for(let i=0;i<2;i++){const score=num(r[12+i]);if(score===undefined)continue;const model=r[1].replace(/\s+(Proprietary|Open-source)$/i,"");rows.push({model:model+(r[2]&&r[2]!=="-"?` (${r[2]})`:""),score,setting:`${i===0?"Open":"MCQ"}, ${r[3]} frames`,metrics:Object.fromEntries(["LP","LR","HP","HR"].flatMap((h,j)=>{const n=num(r[4+j*2+i]);return n===undefined?[]:[[h,n]];}))});}
    if (!rows.length) throw new Error("No videoeval-pro score rows");
    return rows.filter(r => r.setting!.startsWith('Open, ')).map(r => {
      const setting = r.setting!.replace('Open, ','');
      const mcq = rows.find(x => x.model===r.model && x.setting===`MCQ, ${setting}`);
      return {...r,setting,metrics:{...r.metrics,...(mcq ? {mcq:mcq.score} : {})}};
    });
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

