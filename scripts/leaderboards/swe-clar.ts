// SWE-Clar ranks its main results by Implementation score over all 100 tasks.
// Clarification score and both reported intervals are secondary metrics; the clarify harness is retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

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
const FEED = "https://raw.githubusercontent.com/upwork/SWE-Clar/master/README.md";
const board: Leaderboard = {
  benchmark: "swe-clar", url: "https://github.com/upwork/SWE-Clar", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.includes("Implementation score (%)"));if(!t)throw new Error("Missing SWE-Clar table");for(const r of t.slice(1))for(let i=1;i<=1;i++){const score=num(r[i]),ci=r[i].match(/\[([\d.]+),\s*([\d.]+)\]/);if(score!==undefined)rows.push({model:r[0],score,harness:"SWE-Clar clarify",metrics:{clarification:num(r[2])!,...(ci?{ciLow:Number(ci[1]),ciHigh:Number(ci[2])}:{}),...(()=>{const c=r[2].match(/\[([\d.]+),\s*([\d.]+)\]/);return (c?{clarificationLow:Number(c[1]),clarificationHigh:Number(c[2])}:{}) as Record<string,number>;})()}});}
    if (!rows.length) throw new Error("No swe-clar score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

