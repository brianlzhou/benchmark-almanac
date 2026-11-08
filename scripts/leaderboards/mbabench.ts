// MBABench v1: the v1 overall score across all three spreadsheet dimensions.
// Product rows remain unlisted when the board does not identify the underlying model.
// The source also has v2 results, which are excluded from this original record.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://mbabench.org/assets/index-BCfvtkED.js";
const board: Leaderboard = {
  benchmark: "mbabench",
  url: "https://mbabench.org/assets/index-BCfvtkED.js",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const s=await fetchText(FEED);const m=/\[\{rank:1,model:"Claude \(Web\)"/.exec(s);
    if(!m)throw new Error('MBABench v1 results missing');
    const data=jsLiteral<any[]>(s,m.index);
    return data.map(r=>({model:r.model,score:r.score,harness:r.type==='API'?'MBABench API harness':r.model,setting:r.type}));
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
