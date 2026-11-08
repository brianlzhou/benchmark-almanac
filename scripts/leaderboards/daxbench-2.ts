// DAXBench ranks models by Score in percent. Read the model and effort spans separately from provider badges, and preserve accuracy, syntax and completed-task counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://www.daxbench.com/";
const board: Leaderboard = {
  benchmark: "daxbench-2", url: "https://www.daxbench.com/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=tables(source).find(t=>t[0]?.some(c=>c.text==="Syntax"));if(!t)throw new Error("Missing DAX table");
    for(const r of t.slice(1)){if(r.length!==6)continue;const spans=[...r[1].html.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map(m=>text(m[1]));const score=num(r[2].text);if(!spans[0]||score===undefined)continue;
      const model=spans[0]==="R1"?"DeepSeek-R1 (snapshot unspecified)":spans[0];const tasks=r[5].text.split("/");rows.push({model,score,setting:spans[1],metrics:{accuracy:num(r[3].text)!,syntax:num(r[4].text)!,completed:num(tasks[0])!,tasks:num(tasks[1])!}});
    }
    if (!rows.length) throw new Error("No daxbench-2 score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

