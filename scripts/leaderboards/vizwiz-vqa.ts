// VizWiz VQA: the paper’s overall answer accuracy, converted from fractions to percentages.
// Citation numbers distinguish architecture variants and remain in their original labels.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/1802.08218";
const board: Leaderboard = {
  benchmark: "vizwiz-vqa",
  url: "https://arxiv.org/html/1802.08218",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.map(c=>c.text).join('|')==='Method|Acc|CIDEr|BLEU|METEOR');
    if(!t)throw new Error('VizWiz answer table missing');
    return t.slice(1).map(r=>({model:r[0].text,score:num(r[1].text)!*100,metrics:{CIDEr:num(r[2].text)!,BLEU:num(r[3].text)!,METEOR:num(r[4].text)!}}));
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
