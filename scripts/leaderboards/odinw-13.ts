// ODinW-13: zero-shot mean AP on the thirteen datasets, as identified by Model Zoo footnote 4. Preserve GLIP variants and pretraining configurations; approximate results keep an approximation setting.
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
const FEED = "https://raw.githubusercontent.com/microsoft/GLIP/main/README.md";
const board: Leaderboard = {
  benchmark: "odinw-13", url: "https://github.com/microsoft/GLIP", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const table=all.find(t => t[0].some(h=>h.includes("ODinW [4]")));
    if (!table) throw new Error("Missing ODinW-13 model zoo");
    for (const r of table.slice(1)) { const score=num(r[4]); if(score===undefined)continue; rows.push({model:r[0].replace(/ \[\d+\]/g,""),score,setting:`zero-shot; pretrain ${r[5]}${r[4].includes("~") ? "; approximate" : ""}`}); }
    if (!rows.length) throw new Error("No odinw-13 score rows");
    return rows;
  },
};
export default board;
