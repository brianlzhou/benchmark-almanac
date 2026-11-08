// InfographicVQA: Tables 5 and 6 report full-test ANLS for M4C and LayoutLM configurations.
// ANLS fractions become percentages. Input features and pretraining describe whole-benchmark configurations.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2104.12756";
const board: Leaderboard = {
  benchmark: "infographicvqa",
  url: "https://arxiv.org/html/2104.12756",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const ts=tables(await fetchText(FEED)); const out:LeaderboardRow[]=[];
    for (const [marker,model] of [['Finetune','M4C'],['Continue','LayoutLM']]) {
      const t=ts.find(t=>t[0]?.some(c=>c.text===marker) && t[0]?.some(c=>c.text==='ANLS'));
      if(!t) throw new Error(`${model} table missing`);
      for(const r of t.slice(2)) {
        if(r.length!==8) throw new Error('InfographicVQA columns changed');
        out.push({model,setting:r.slice(0,4).map(c=>c.text).join(', '),score:num(r[5].text)!*100,metrics:{accuracy:num(r[7].text)!}});
      }
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
