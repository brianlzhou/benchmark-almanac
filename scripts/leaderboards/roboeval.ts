// RoboEval: the official global success mean across all tasks, as a percentage (the board's 0 to 1 mean times 100,
// the scale lab results use). The other behavior metrics stay on the board's 0 to 1 scale.
// Other published behavior metrics remain secondary. Human demonstration results are excluded.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://robo-eval.github.io/static/data/leaderboard_global.json";
const board: Leaderboard = {
  benchmark: "roboeval",
  url: "https://robo-eval.github.io/static/data/leaderboard_global.json",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const data=await fetchJson<any[]>(FEED);
    return data.filter(r=>! /human/i.test(r.method)).map(r=>({model:r.method,score:r.metrics.success.mean*100,metrics:Object.fromEntries(Object.entries(r.metrics).filter(([k])=>k!=='success').map(([k,v])=>[k,(v as any).mean]))}));
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
