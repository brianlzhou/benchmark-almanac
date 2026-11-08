// SpatialViz-Bench: the official script’s reported whole-test overall, direct, or CoT accuracy.
// Direct and CoT are prompt configurations across the same full benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://wangst0181.github.io/SpatialViz-Bench/assets/main.js?v=4";
const board: Leaderboard = {
  benchmark: "spatialviz-bench",
  url: "https://wangst0181.github.io/SpatialViz-Bench/assets/main.js?v=4",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const s=await fetchText(FEED);const marker=s.indexOf('const leaderboard =');if(marker<0)throw new Error('SpatialViz array missing');
    const d=jsLiteral<{model:string,overall?:number,direct?:number,cot?:number}[]>(s,s.indexOf('[',marker));const out:LeaderboardRow[]=[];
    for(const r of d){
      if(typeof r.overall==='number')out.push({model:r.model,score:r.overall});
      else for(const k of ['direct','cot'] as const)if(typeof r[k]==='number')out.push({model:r.model,score:r[k]!,setting:k});
    }return out;
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
