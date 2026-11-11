// WorldModelBench: total.overall, the column the official index.js sorts descending on initial load.
// Instruction following, common sense and physics adherence are secondary metrics.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://worldmodelbench-team.github.io/leaderboard_data.json";
const board: Leaderboard = {
  benchmark: "worldmodelbench",
  url: "https://worldmodelbench-team.github.io/leaderboard_data.json",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const d=await fetchJson<{leaderboardData:{info:{name:string,date?:string},total:Record<string,string>,pro:Record<string,string>,test:Record<string,string>,validation:Record<string,string>}[]}>(FEED);
    return d.leaderboardData.filter(r=>num(r.total?.overall)!==undefined).map(r=>({model:r.info.name,score:num(r.total.overall)!,date:r.info.date,metrics:{instruction:num(r.pro.overall)!,commonSense:num(r.test.overall)!,physics:num(r.validation.overall)!}}));
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
