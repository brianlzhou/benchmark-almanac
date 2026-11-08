// WinoGrande: the paper’s main comparison reports test accuracy, already in percent.
// Development accuracy is a metric. The inaccessible AllenAI board cannot supply later submissions.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/1907.10641";
const board: Leaderboard = {
  benchmark: "winogrande",
  url: "https://arxiv.org/html/1907.10641",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.map(c=>c.text).join('|') === 'Methods|dev acc. (%)|test acc.(%)');
    if (!t) throw new Error('WinoGrande main table missing');
    return t.slice(1).filter(r=>!/^Human/.test(r[0].text)).map(r=>({model:r[0].text.replace(/ ⋆$/, ''),score:num(r[2].text)!,metrics:{dev:num(r[1].text)!}}));
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
