// TruthfulQA: human-rated truthfulness (% true) is the score, with informativeness and automatic metrics retained. Use only the current updated-reference baseline table; exclude v0.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

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
const FEED = "https://raw.githubusercontent.com/sylinrl/TruthfulQA/main/README.md";
const board: Leaderboard = {
  benchmark: "truthfulqa", url: "https://github.com/sylinrl/TruthfulQA", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    for (const [i, table] of all.filter(t => t[0].includes("% true")).slice(0,1).entries()) {
      const head = table[0];
      for (const r of table.slice(1)) {
        const score = num(r[1]); if (!r[0] || score === undefined) continue;
        rows.push({model:r[0], score, setting:i === 0 ? "generation, updated references" : "generation, v0", metrics:Object.fromEntries(head.slice(2).flatMap((h,j) => {const n=num(r[j+2]); return n === undefined ? [] : [[h,n]];}))});
      }
    }
    if (!rows.length) throw new Error("No truthfulqa score rows");
    return rows;
  },
};
export default board;
