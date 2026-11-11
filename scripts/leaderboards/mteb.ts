// MTEB: the original English v1 suite, matching the catalog’s original benchmark.
// The API publishes meanTask as its headline mean. Fractions become percentages.
// Task-type aggregates remain metrics, and other MTEB suites are excluded.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MTEB%28eng%2C%20v1%29/scores";
const board: Leaderboard = {
  benchmark: "mteb",
  url: "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MTEB%28eng%2C%20v1%29/scores",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    type R={model:{name:string},meanTask:number|null,scoresByTaskType:Record<string,number>,zeroShotPct:number};
    const d=await fetchJson<{benchmarkName:string,rows:R[]}>(FEED);
    if(d.benchmarkName!=='MTEB(eng, v1)')throw new Error('MTEB suite changed');
    return d.rows.filter(r=>typeof r.meanTask==='number').map(r=>({model:r.model.name,score:r.meanTask!*100,metrics:Object.fromEntries(Object.entries(r.scoresByTaskType).filter(([,v])=>typeof v==='number').map(([k,v])=>[k,v*100]))}));
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
