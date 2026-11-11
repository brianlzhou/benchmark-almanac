// XTREME-R: the published Avg across all ten tasks.
// Only complete zero-shot-transfer rows have an Avg. Incomplete translate-train rows are not invented.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2104.07412";
const board: Leaderboard = {
  benchmark: "xtreme-r",
  url: "https://arxiv.org/html/2104.07412",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.[1]?.text==='Avg' && t[1]?.some(c=>c.text==='Mewsli-X'));
    if(!t)throw new Error('XTREME-R main table missing');
    return t.filter(r=>r.length===12 && num(r[1].text)!==undefined && r[0].text!=='Metrics').map(r=>({model:r[0].text,score:num(r[1].text)!,setting:'English supervised, zero-shot transfer'}));
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
