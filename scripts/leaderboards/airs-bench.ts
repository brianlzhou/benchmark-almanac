// AIRS-Bench ranks research agents by the published average normalized score. Keep agent scaffold, seed count, uncertainty, and publication date from the live README.
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
const FEED = "https://raw.githubusercontent.com/facebookresearch/airs-bench/main/README.md";
const board: Leaderboard = {
  benchmark: "airs-bench", url: "https://raw.githubusercontent.com/facebookresearch/airs-bench/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.[0]==="Agent"&&t[0]?.[1].includes("norm. score"));if(!t)throw new Error("Missing AIRS table");
    for(const r of t.slice(1)){const score=num(r[1]);const m=r[0].match(/^(Greedy|MLGym|One-Shot)\s+(.+)$/);if(!m||score===undefined)continue;
    const uncertainty=num(r[1].split("±")[1]);rows.push({model:m[2]==="GPT-4o"?"GPT-4o (snapshot unspecified)":m[2],score,harness:m[1],date:r[3],metrics:{seeds:num(r[2])!,...(uncertainty===undefined?{}:{uncertainty})}}); }
    if (!rows.length) throw new Error("No airs-bench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

