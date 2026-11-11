// Lech Mazur creative writing uses the current pairwise Comparison score, not the archived absolute ratings. Preserve estimated win chance and bootstrap intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let current: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if ((line.match(/\|/g) ?? []).length < 2) { if (current.length) out.push(current); current = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => text(c.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, "")));
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, "")))) continue;
    current.push(cells);
  }
  if (current.length) out.push(current);
  return out;
}
const FEED = "https://raw.githubusercontent.com/lechmazur/writing/master/README.md";
const board: Leaderboard = {
  benchmark: "lech-mazur-creative-writing", url: "https://raw.githubusercontent.com/lechmazur/writing/master/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.includes("Comparison score"));if(!t)throw new Error("Missing writing comparison table");
    for(const r of t.slice(1)){const score=num(r[2]);if(score===undefined)continue;let model=r[1].replace(/[§‡¶^†※]+$/g,"").trim();let setting:string|undefined;const m=model.match(/\s*\((high|xhigh|medium|low|max|thinking)\)$/);if(m){setting=m[1];model=model.slice(0,m.index);}else if(/ Thinking \d+K$/.test(model)){const m=model.match(/^(.*?) Thinking (\d+K)$/)!;model=m[1];setting="thinking "+m[2];}else if(/ (Thinking|Reasoning)$/.test(model)){setting=model.split(" ").at(-1);model=model.replace(/ (Thinking|Reasoning)$/,'');}
    const ci=r[4].split(" to ").map(num);rows.push({model,score,setting,metrics:{winChance:num(r[3])!,ciLow:ci[0]!,ciHigh:ci[1]!}}); }
    if (!rows.length) throw new Error("No lech-mazur-creative-writing score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

