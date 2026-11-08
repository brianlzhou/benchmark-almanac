// CombiBench: solved problems out of 100 are numerically the percent solved.
// Both solution-prompt configurations cover the same full set. The board reports pass@16 throughout.
// Read the two named inline arrays as data without executing the page scripts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://moonshotai.github.io/CombiBench/leaderboard.html";
const board: Leaderboard = {
  benchmark: "combibench",
  url: "https://moonshotai.github.io/CombiBench/leaderboard.html",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const html=await fetchText(FEED);const out:LeaderboardRow[]=[];
    for(const [marker,setting] of [['const renderLeaderboard =','with solution'],['const renderWithoutSolution =','without solution']]) {
      const section=html.slice(html.indexOf(marker)); const start=section.indexOf('[',section.indexOf('const leaderboardData ='));
      const data=jsLiteral<{model:string,solved:number,compute:string}[]>(section,start);
      for(const r of data)out.push({model:r.model,score:r.solved,setting:`${setting}, ${r.compute}`});
    }
    if(out.length<10)throw new Error('CombiBench arrays missing');return out;
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
