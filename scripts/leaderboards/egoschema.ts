// EgoSchema: paper Table 1 reports QA accuracy on the full dataset.
// Frame counts configure whole-video inference. Carry model names across the paper’s rowspan cells.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2308.09126";
const board: Leaderboard = {
  benchmark: "egoschema",
  url: "https://arxiv.org/html/2308.09126",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Inference') && t[0]?.some(c=>c.text==='QA'));
    if(!t) throw new Error('EgoSchema main table missing');
    const out:LeaderboardRow[]=[];let model='';
    for(const r of t.slice(2)) {
      if(r.length===5)model=r[0].text.replace(/ \[.*?\]/g,'');
      if(!model)continue;
      const score=num(r.at(-1)?.text);if(score===undefined)continue;
      out.push({model,score,setting:r.at(-2)!.text});
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
