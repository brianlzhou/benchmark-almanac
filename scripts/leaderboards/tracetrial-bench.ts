// TraceTrial-Bench: layered is the board’s Overall score and default sort column.
// It is the published equal-weight mean of Agent Score and Harness Macro. No aggregate is recomputed.
// Resource values are means per selected execution of one task. Output tokens are stored in thousands in the feed.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://tracelite.ai/data/leaderboard.json";
const board: Leaderboard = {
  benchmark: "tracetrial-bench",
  url: "https://tracelite.ai/leaderboard.html",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  chart:{title:'Cost and overall performance',x:{key:'cost',label:'Cost per task',unit:'$',better:'lower'},y:{key:'score',label:'Overall score',unit:'%',better:'higher'},note:'Costs exclude judge calls and discarded runs.'},
  async fetch() {
    const data=await fetchJson<any[]>(FEED);
    return data.filter(r=>r.model!=='All models'&&r.harness!=='All Harnesses').map(r=>({model:r.model,score:r.layered,harness:r.harness,cost:r.cost,tokens:r.out_k*1000,metrics:{taskPass:r.pass,agentScore:r.score,harnessMacro:r.macro,harnessMicro:r.micro,clean:r.clean,inputTokens:r.in_k*1000,totalTokens:r.total_k*1000,cost:r.cost}}));
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
