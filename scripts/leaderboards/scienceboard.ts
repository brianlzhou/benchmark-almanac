// ScienceBoard: the main board’s Acc column covers all six scientific domains.
// Input modality and the published protocol distinguish whole-suite runs.
// The separate SeeAct board omits domains and is excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://qiushisun.github.io/ScienceBoard-Home/";
const board: Leaderboard = {
  benchmark: "scienceboard",
  url: "https://qiushisun.github.io/ScienceBoard-Home/",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const s=await fetchText(FEED);const start=s.indexOf('rowData:',s.indexOf('const gridOptions ='));
    const rows=jsLiteral<any[]>(s,s.indexOf('[',start));
    return rows.map(r=>{
      const [model,mode]=r.model.split(' w/ ');
      return {model,score:r.acc,setting:mode,harness:r.harness?'ScienceBoard harness':'ScienceBoard baseline',metrics:Object.fromEntries(['alg','bio','gis','atp','ast','doc'].filter(k=>typeof r[k]==='number').map(k=>[k,r[k]]))};
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
