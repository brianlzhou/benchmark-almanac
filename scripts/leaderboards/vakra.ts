// VAKRA: the public API’s overall score, in percent, across the full benchmark.
// The named agent goes in harness. Component scores remain metrics.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://ibm-research-vakra.hf.space/api/leaderboard";
const board: Leaderboard = {
  benchmark: "vakra",
  parts: {
    api_chaining: { name: 'API chaining', group: 'Task type' },
    tool_selection: { name: 'Tool selection', group: 'Task type' },
    multihop: { name: 'Multi-hop', group: 'Task type' },
    multiturn: { name: 'Multi-turn', group: 'Task type' },
  },
  url: "https://ibm-research-vakra.hf.space/api/leaderboard",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const d=await fetchJson<{model:string,agent:string,date?:string,overall:number,scores:Record<string,number>}[]>(FEED);
    return d.filter(r=>typeof r.overall==='number').map(r=>{
      const stamp = Date.parse((r.date ?? '') + ' UTC');
      return {model:r.model,score:r.overall,harness:r.agent,metrics:r.scores,
        date:Number.isFinite(stamp) ? new Date(stamp).toISOString().slice(0,10) : undefined};
    });
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
