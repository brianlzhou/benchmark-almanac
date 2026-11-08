// Era by Eon: the paper’s whole-evaluation accuracy in percent.
// Intervals are secondary metrics. The account console is not needed for this public paper table.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2609.09853";
const board: Leaderboard = {
  benchmark: "era-by-eon",
  url: "https://arxiv.org/html/2609.09853",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.map(c=>c.text).join('|')==='Model|Accuracy|95% interval|Wrong|FA|NA');
    if(!t)throw new Error('Era accuracy table missing');
    return t.slice(1).map(r=>({model:r[0].text,score:num(r[1].text)!,metrics:{wrong:num(r[3].text)!,falseAbstention:num(r[4].text)!,noAnswer:num(r[5].text)!}}));
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
