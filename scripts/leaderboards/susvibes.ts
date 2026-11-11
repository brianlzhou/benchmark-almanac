// SusVibes: sec_pass_1 is the percentage of tasks with functional and secure solutions.
// Python is the complete original benchmark, not a language subset. Agent frameworks remain harnesses.
// The importer uses published results and does not copy contact details.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://leililab.github.io/susvibes-leaderboard/submissions/index.json";
const board: Leaderboard = {
  benchmark: "susvibes",
  url: "https://leililab.github.io/susvibes-leaderboard/submissions/index.json",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  aliases: {'Claude 4 Sonnet':'claude-sonnet-4'},
 async fetch() {
    const data=(await fetchJson<any>(FEED)).submissions;const out:LeaderboardRow[]=[];
    for(const r of data){
      if(r.methodology?.susvibes_version!=='v1.0')continue;
      const a=r.results?.python;if(typeof a?.sec_pass_1!=='number')continue;
      const mode=r.submissionDir.match(/_(default|[a-z-]+)_\d{4}-\d{2}-\d{2}$/)?.[1]??'default';
      out.push({model:r.model_name,score:a.sec_pass_1,harness:r.methodology.agent_framework,setting:mode,date:r.submission_date,metrics:{functionalPass1:a.func_pass_1},...(typeof a.cost==='number'?{cost:a.cost}:{})});
    }return out;
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
