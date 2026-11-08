// ConvFinQA main model comparison uses execution accuracy on the full test set.
// Program accuracy remains a secondary metric. Human reference rows are not model evaluations.
// FinQANet-Gold uses gold retrieval, which is a distinct whole-benchmark configuration.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2210.03849";
const board: Leaderboard = {
  benchmark: "convfinqa",
  url: "https://arxiv.org/html/2210.03849",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text)));
    const t=ts.find(t=>t.some(r=>r[0]==='GPT-2(medium)'));
    if(!t) throw new Error('Main results missing');
    return t.slice(1).filter(r=>num(r[1])!==undefined && !/Human|Crowd/i.test(r[0])).map(r=>({model:r[0],score:num(r[1])!,metrics:{programAccuracy:num(r[2])!}}));
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
