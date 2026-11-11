// T-Eval: the official English leaderboard’s overall score, in percent.
// The six process scores remain metrics on one whole-benchmark row.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://open-compass.github.io/T-Eval/scores.csv";
const board: Leaderboard = {
  benchmark: "t-eval",
  url: "https://open-compass.github.io/T-Eval/scores.csv",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const out=parseCsv(await fetchText(FEED)).map(r=>({model:r.Model,score:Number(r.overall),metrics:Object.fromEntries(['instruct','plan','reason','retrieve','understand','review'].map(k=>[k,Number(r[k])]))}));
    if(!out.length)throw new Error('T-Eval CSV empty');return out;
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
