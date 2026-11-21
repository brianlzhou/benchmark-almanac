// CAP-X / CAP-Bench: the published avgSuccessRate over all six simulation tasks.
// Keep the six task scores and the source’s open or closed designation. Hardware experiments are not pooled with simulation.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://capgym.github.io/data/model_data.json";
const board: Leaderboard = {
  benchmark: "cap-x-cap-bench",
  parts: {
    'Cube Lift': { name: 'Cube lift', group: 'Task type' },
    'Cube Stack': { name: 'Cube stack', group: 'Task type' },
    'Spill Wipe': { name: 'Spill wipe', group: 'Task type' },
    'Peg Insert': { name: 'Peg insert', group: 'Task type' },
    'Two Arm Lift': { name: 'Two arm lift', group: 'Task type' },
    'Two Arm Handover': { name: 'Two arm handover', group: 'Task type' },
  },
  url: "https://capgym.github.io/data/model_data.json",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const d=await fetchJson<{models:{displayName:string,isClosed?:boolean,avgSuccessRate:number,taskSuccessRates:Record<string,number>}[]}>(FEED);
    return d.models.filter(r=>typeof r.avgSuccessRate==='number').map(r=>({model:r.displayName,open:typeof r.isClosed==='boolean'?!r.isClosed:undefined,score:r.avgSuccessRate,metrics:r.taskSuccessRates}));
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
