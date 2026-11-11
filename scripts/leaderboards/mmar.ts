// MMAR: Avg is audio reasoning accuracy in percent. Preserve reported model sizes, caption scaffolds and all sound/music/speech mixture accuracies; exclude random guessing.
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
const FEED = "https://raw.githubusercontent.com/ddlbojack/mmar/main/README.md";
const board: Leaderboard = {
  benchmark: "mmar", url: "https://github.com/ddlbojack/mmar", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].includes("Sound-Music-Speech"));if(!table)throw new Error("Missing MMAR leaderboard");
    for(const r of table.slice(1)){const score=num(r[3]);if(score===undefined||/Random Guess/i.test(r[0]))continue;let model=r[0].replace(/[🏅🥇🥈🥉]/gu,"").trim();let harness:string|undefined;if(model.startsWith("Caption + ")){model=model.slice(10);harness="Caption";}rows.push({model:model+(r[1]&&r[1]!=="-"?` (${r[1]})`:""),score,harness,metrics:Object.fromEntries(table[0].slice(4).flatMap((h,j)=>{const n=num(r[j+4]);return n===undefined?[]:[[h,n]];}))});}
    if (!rows.length) throw new Error("No mmar score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;
