// WildVision-Bench vision_bench_0617: Score is the leaderboard ranking score, distinct from win rate. Preserve average response tokens, reward and preference counts without converting the headline score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let current: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if ((line.match(/\|/g) ?? []).length < 2) { if (current.length) out.push(current); current = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => text(c.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')));
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    current.push(cells);
  }
  if (current.length) out.push(current);
  return out;
}
const FEED = "https://raw.githubusercontent.com/WildVision-AI/WildVision-Bench/main/README.md";
const board: Leaderboard = {
  benchmark: "wildvision-bench", url: "https://raw.githubusercontent.com/WildVision-AI/WildVision-Bench/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].includes("Avg Tokens")&&t[0].includes("Reward"));if(!table)throw new Error("Missing WildVision table");
    for(const r of table.slice(1)){const score=num(r[1]);if(score===undefined)continue;rows.push({model:r[0],score,setting:"vision_bench_0617",tokens:num(r[10]),metrics:Object.fromEntries(table[0].slice(3,10).flatMap((h,j)=>{const n=num(r[j+3]);return n===undefined?[]:[[h,n]];}))});}
    if (!rows.length) throw new Error("No wildvision-bench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;
