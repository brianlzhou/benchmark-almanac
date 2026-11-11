// MiMo Code Bench: the maker’s current overview array, percentages in the published model order.
// The importer reads model labels and score arrays without evaluating the script.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://mimo.xiaomi.com/mimo-v2-6/bench.js";
const board: Leaderboard = {
  benchmark: "mimo-code-bench",
  url: "https://mimo.xiaomi.com/mimo-v2-6/bench.js",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const s=await fetchText(FEED);const block=s.match(/const MODELS = \[([\s\S]*?)\n\s*\];/)?.[1];
    if(!block)throw new Error('MiMo model list missing');
    const models=[...block.matchAll(/\bname: '([^']+)'/g)].map(m=>m[1]);
    const scores=JSON.parse(s.match(/name: 'MiMo Code Bench',\s*scores: (\[[^\]]*\])/)?.[1]??'null') as (number|null)[];
    if(!scores||scores.length!==models.length)throw new Error('MiMo columns changed');
    return scores.flatMap((score,i)=>typeof score==='number'?[{model:models[i],score}]:[]);
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
