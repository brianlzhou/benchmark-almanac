// CommonsenseQA: paper Table 5, random-split test accuracy, the official leaderboard split.
// The question-concept split and SANITY control are diagnostic metrics, never separate rows.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/1811.00937";
const board: Leaderboard = {
  benchmark: "commonsenseqa",
  url: "https://arxiv.org/html/1811.00937",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c=>c.text==='Random split') && t[1]?.some(c=>c.text==='SANITY'));
    if (!t) throw new Error('CommonsenseQA test table missing');
    return t.slice(2).filter(r=>r.length===5 && r[0].text!=='Human').map(r=>({model:r[0].text,score:num(r[1].text)!,metrics:{sanity:num(r[2].text)!,conceptSplit:num(r[3].text)!}}));
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
