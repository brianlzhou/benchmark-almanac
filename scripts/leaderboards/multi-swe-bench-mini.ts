// Multi-SWE-bench mini: All-language resolvedRate on the 400-task mini set, as a percent.
// Only the All view supplies rows. Difficulty slices remain metrics. Exact repeated entries are deduplicated.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/multi-swe-bench/experiments/refs/heads/dist/leaderboard-mini.json";
const board: Leaderboard = {
  benchmark: "multi-swe-bench-mini",
  url: "https://raw.githubusercontent.com/multi-swe-bench/experiments/refs/heads/dist/leaderboard-mini.json",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    type R={name:string,resolvedRate:number,resolvedEasyRate:number,resolvedMediumRate:number,resolvedHardRate:number,date:string,verified:boolean};
    const d=await fetchJson<{name:string,data:{name:string,results:R[]}[]}[]>(FEED);
    const all=d.find(r=>r.name==='All');if(!all)throw new Error('All view missing');
    const out=new Map<string,LeaderboardRow>();
    for(const group of all.data)for(const r of group.results){
      const [harness,...parts]=r.name.split(' + ');const model=parts.length?parts.join(' + '):r.name;
      const row:LeaderboardRow={model,score:r.resolvedRate*100,harness:parts.length?harness:undefined,setting:r.verified?'verified':'self-reported',date:r.date,metrics:{easy:r.resolvedEasyRate*100,medium:r.resolvedMediumRate*100,hard:r.resolvedHardRate*100}};
      const key=JSON.stringify([row.model,row.harness,row.setting]);
      if(out.has(key)&&out.get(key)!.score!==row.score)throw new Error('Conflicting duplicate mini result');out.set(key,row);
    }return [...out.values()];
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
