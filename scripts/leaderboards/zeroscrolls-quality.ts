// ZeroSCROLLS QuALITY: QALT accuracy in the paper’s main comparison.
// This catalog record names QuALITY only, so other suite tasks are excluded. Token limits apply to the whole evaluation.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2305.14196";
const board: Leaderboard = {
  benchmark: "zeroscrolls-quality",
  url: "https://arxiv.org/html/2305.14196",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='QALT') && t[0]?.some(c=>c.text==='BkSS'));
    if(!t)throw new Error('ZeroSCROLLS main table missing');
    const col=t[0].findIndex(c=>c.text==='QALT');
    return t.slice(2).filter(r=>r.length===13 && !['Naive','Human'].includes(r[0].text)).map(r=>({model:r[0].text,score:num(r[col].text)!,setting:`${r[1].text} input token limit`}));
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
