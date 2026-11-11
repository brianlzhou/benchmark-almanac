// OST-Bench reports online scene-understanding accuracy percentages under multi-round and VLMEvalkit interleaved settings. Preserve both protocols and task scores, excluding human and chance references.
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
const FEED = "https://raw.githubusercontent.com/OpenRobotLab/OST-Bench/main/README.md";
const board: Leaderboard = {
  benchmark: "ost-bench", url: "https://github.com/OpenRobotLab/OST-Bench", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    let n=0;for(const t of all){if(!t[0]?.includes("AO-Spatial"))continue;const protocol=++n===1?"Multi-round":"VLMEvalkit interleaved";for(const r of t.slice(1)){const score=num(r[1]);if(score===undefined||/Human-Level|Chance-Level/.test(r[0]))continue;let model=r[0].replace("Gemimi","Gemini"),thinking=/\(Thinking\)/i.test(model);model=model.replace(/\(Thinking\)/i,"");const metrics:Record<string,number>={};for(let i=2;i<r.length;i++){const x=num(r[i]);if(x!==undefined)metrics[t[0][i]]=x;}rows.push({model,score,setting:protocol+(thinking?"; thinking":""),metrics});}}
    if (!rows.length) throw new Error("No ost-bench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

