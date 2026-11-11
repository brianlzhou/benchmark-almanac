// IndoMMLU: Average is zero-shot multiple-choice accuracy in percent. Keep model sizes and five subject-group accuracies, excluding the random baseline.
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
const FEED = "https://raw.githubusercontent.com/fajri91/IndoMMLU/main/README.md";
const board: Leaderboard = {
  benchmark: "indommlu", url: "https://raw.githubusercontent.com/fajri91/IndoMMLU/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].includes("Local L. Culture"));if(!table)throw new Error("Missing IndoMMLU table");
    for(const r of table.slice(1)){const score=num(r[6]);if(score===undefined||r[0]==="Random")continue;rows.push({model:r[0],score,setting:"zero-shot",metrics:Object.fromEntries(table[0].slice(1,6).flatMap((h,j)=>{const n=num(r[j+1]);return n===undefined?[]:[[h,n]];}))});}
    if (!rows.length) throw new Error("No indommlu score rows");
    return rows;
  },
};
export default board;
