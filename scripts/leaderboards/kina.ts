// KINA: ALL is the official overall accuracy in percent. Preserve subject accuracies and explicit thinking variants without inventing averages across fields.
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
const FEED = "https://huggingface.co/datasets/2077AIDataFoundation/KINA/resolve/main/README.md";
const board: Leaderboard = {
  benchmark: "kina", url: "https://huggingface.co/datasets/2077AIDataFoundation/KINA/resolve/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].includes("ALL")&&t[0].includes("Agronomy"));if(!table)throw new Error("Missing KINA table");
    for(const r of table.slice(1)){const score=num(r[2]);if(score===undefined)continue;rows.push({model:r[0],score,setting:/Thinking/i.test(r[0])?"thinking":undefined,metrics:Object.fromEntries(table[0].slice(3).flatMap((h,j)=>{const n=num(r[j+3]);return n===undefined?[]:[[h,n]];}))});}
    if (!rows.length) throw new Error("No kina score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

