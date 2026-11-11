// WorldTravel: main table feasibility rate across all 150 tasks.
// Text and vision are whole-benchmark input settings. Constraint violation and feasible optimality stay as metrics.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2602.08367";
const board: Leaderboard = {
  benchmark: "worldtravel",
  url: "https://arxiv.org/html/2602.08367",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.[0]?.text==='Model' && t[0]?.some(c=>c.text.startsWith('Feasibility Rate')));
    if(!t)throw new Error('WorldTravel main table missing');
    let setting='';const out:LeaderboardRow[]=[];
    for(const r of t.slice(1)) {
      if(r.length===1){setting=r[0].text;continue;}
      if(r.length!==4 || !setting || /human/i.test(r[0].text))continue;
      out.push({model:r[0].text,setting,score:num(r[1].text)!,metrics:{violation:num(r[2].text)!,optimality:num(r[3].text)!}});
    }
    return out;
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
