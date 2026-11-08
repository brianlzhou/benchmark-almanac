// SCROLLS: the paper’s published Avg over seven long-document tasks.
// The input token limit changes how models run the whole suite. It is not a context-length subset score.
// The original board redirects away from the project.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2201.03533";
const board: Leaderboard = {
  benchmark: "scrolls",
  url: "https://arxiv.org/html/2201.03533",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='CNLI') && t[0]?.some(c=>c.text==='Avg'));
    if(!t)throw new Error('SCROLLS main table missing');
    const out:LeaderboardRow[]=[];let model='';
    for(const r of t.slice(2)){
      const cells=r.map(c=>c.text);if(cells.length===10)model=cells.shift()!;
      if(model==='Naive'||cells.length!==9)continue;
      out.push({model,setting:`${cells[0]} input token limit`,score:num(cells[8])!});
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
