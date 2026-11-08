// SWE-Perf: the board’s Performance percentage is runtime improvement across the benchmark.
// Oracle and Realistic are whole-suite access settings. Patch application and correctness remain metrics.
// Duplicate identical source rows are collapsed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://swe-perf.github.io/performances.json";
const board: Leaderboard = {
  benchmark: "swe-perf",
  url: "https://swe-perf.github.io/performances.json",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const data=(await fetchJson<any>(FEED)).performances;const out:LeaderboardRow[]=[];const seen=new Set<string>();
    for(const r of data){
      let model=r.model;let harness: string|undefined;
      const m=model.match(/^(.*)-(OpenHands|Agentless)$/);if(m){model=m[1];harness=m[2];}
      if(model==='Claude-3.7')model='Claude 3.7 Sonnet';
      if(model==='Qwen3-Coder')model+=' (size unspecified)';
      const key=JSON.stringify([model,r.category,harness,r.performance]);if(seen.has(key))continue;seen.add(key);
      out.push({model,score:r.performance,setting:r.category,harness,metrics:{apply:r.apply,correctness:r.correctness}});
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
