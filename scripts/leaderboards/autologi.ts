// AutoLogi: Overall Scores is the official mean of English and Chinese augmented-task accuracies, in percent. Preserve both language scores and their reported uncertainty.
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
const FEED = "https://raw.githubusercontent.com/8188zq/AutoLogi/main/README.md";
const board: Leaderboard = {
  benchmark: "autologi", url: "https://raw.githubusercontent.com/8188zq/AutoLogi/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].includes("Overall Scores"));if(!table)throw new Error("Missing AutoLogi results");
    for(const r of table.slice(1)){const score=num(r[3]);if(score===undefined)continue;const metrics:Record<string,number>={};for(const [j,key] of [[1,"EN"],[2,"CN"]] as const){const n=num(r[j]);const err=num(r[j]?.split("±")[1]);if(n!==undefined)metrics[key]=n;if(err!==undefined)metrics[key+"Uncertainty"]=err;}rows.push({model:r[0],score,setting:"augmented",metrics});}
    if (!rows.length) throw new Error("No autologi score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;
