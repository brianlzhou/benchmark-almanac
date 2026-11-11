// Kaleidoscope: overall total accuracy in percent, including format failures.
// Multimodal and text-only accuracies and their format diagnostics remain metrics.
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
const FEED = "https://huggingface.co/datasets/CohereLabs/kaleidoscope/resolve/main/README.md";
const board: Leaderboard = {
  benchmark: "kaleidoscope-cohere", url: "https://huggingface.co/datasets/CohereLabs/kaleidoscope/resolve/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.[0]==="Model"&&t[0]?.includes("Text-only"));if(!t)throw new Error("Missing Kaleidoscope table");
    for(const r of t.slice(2))for(const [offset,setting] of [[1,"overall"],[4,"multimodal"],[7,"text-only"]] as const){const score=num(r[offset]);if(score!==undefined)rows.push({model:r[0],score,setting,metrics:{formatError:num(r[offset+1])!,validAccuracy:num(r[offset+2])!}});}
    if (!rows.length) throw new Error("No kaleidoscope-cohere score rows");
    return rows.filter(r=>r.setting==='overall').map(r=>({...r,setting:undefined,
      metrics:{...r.metrics,...Object.fromEntries(rows.filter(x=>x.model===r.model&&x.setting!=='overall').flatMap(x=>{
        const key=x.setting!.replace('-','_');return [[key,x.score],...Object.entries(x.metrics??{}).map(([k,v])=>[key+'_'+k,v])];
      }))}}));
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

