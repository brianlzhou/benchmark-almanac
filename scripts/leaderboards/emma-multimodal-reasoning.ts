// EMMA: overall accuracy on the full EMMA test, in percent. EMMA-mini remains a separate subset.
// Chain-of-thought is a whole-benchmark prompt configuration. Undated model names remain unresolved.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://emma-benchmark.github.io/emma_leaderboard.json";
const board: Leaderboard = {
  benchmark: "emma-multimodal-reasoning",
  url: "https://emma-benchmark.github.io/emma_leaderboard.json",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const d=await fetchJson<{leaderboardData:{info:{name:string,CoT:string,type:string},emma:Record<string,string>}[]}>(FEED);
    const out:LeaderboardRow[]=[];
    for(const r of d.leaderboardData) {
      if(/random|human/.test(r.info.type))continue;
      const score=num(r.emma.overall);if(score===undefined)continue;
      const metrics=Object.fromEntries(['math','physics','chemistry','coding'].map(k=>[k,num(r.emma[k])]).filter(([,v])=>v!==undefined)) as Record<string,number>;
      out.push({model:r.info.name,score,setting:r.info.CoT==='true'?'CoT':'no CoT',metrics});
    }
    if(!out.length)throw new Error('EMMA scores missing');return out;
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  if (r.model === 'gemini-2.0-flash-thinking-exp-1219') return {...r, model: r.model + ' (December 2024 snapshot not cataloged)'};
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
