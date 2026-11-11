// RobotWorld's default board uses successful tasks divided by all 84 registered tasks.
// The source says: "Score is always shown over all 84 tasks; scored coverage is a separate progress bar."
// Source formula: https://robotworldai.github.io/assets/js/home.js?v=20261007-outcomes
// Costs and output tokens are per-task means over scored runs with recorded usage.
// The source says: "per-task mean over scored runs with recorded usage, scaled to all tasks".
// This importer keeps the mean without scaling it to the full suite. Missing runs count as failures, as on the board.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://robotworldai.github.io/data/data.json";
const board: Leaderboard = {
  benchmark: "robotworld",
  url: "https://robotworldai.github.io/",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  chart: {title:'Success rate versus cost',x:{key:'cost',label:'Mean recorded task cost',unit:'$',better:'lower'},y:{key:'score',label:'Success rate',unit:'%',better:'higher'}},
  async fetch() {
    const d = await fetchJson(FEED) as any;
    await new Promise(r => setTimeout(r, 1100));
    const usage = await fetchJson('https://robotworldai.github.io/data/usage.json') as any;
    const names = {Astra:'GPT-6 Astra', Opus:'Claude Opus 5.5', K3:'Kimi K3', DPSK:'DeepSeek V4.1 Flash', Gemini:'Gemini 3.8 Flash'};
    if (!(d.registered > 0)) throw new Error('Missing registered task count');
    return Object.entries(names).map(([key,model]) => {
      const runs = d.runs.filter((r:any) => r.model === key);
      const us = runs.filter((r:any) => r.score !== null && usage[r.id] && !usage[r.id].zero).map((r:any) => usage[r.id]);
      const priced = us.filter((u:any) => typeof u.cost === 'number');
      const output = us.filter((u:any) => typeof u.outputTokens === 'number');
      const cost = priced.length ? priced.reduce((s:number,u:any)=>s+u.cost,0)/priced.length : undefined;
      return {model, score:100*runs.filter((r:any)=>r.score===1).length/d.registered,
        ...(cost !== undefined ? {cost} : {}),
        ...(output.length ? {tokens:output.reduce((s:number,u:any)=>s+u.outputTokens,0)/output.length} : {}),
        metrics:{scored:runs.filter((r:any)=>r.score!==null).length, registered:d.registered,
          ...(cost !== undefined ? {cost} : {}),
          ...(us.length ? {totalTokensPerTask:us.reduce((s:number,u:any)=>s+u.totalTokens,0)/us.length} : {})}};
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
