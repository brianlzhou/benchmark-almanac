// SwitzerlandQA: the benchmark’s column in the Apertus report, in percent.
// The main pretrained and instruction-tuned comparisons identify different model checkpoints.
// Pretrained checkpoint labels stay unlisted because the registry does not consistently distinguish base and instruction-tuned models.
// Training-data ablations are excluded.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2509.14233";
const board: Leaderboard = {
  benchmark: "switzerlandqa-swiss-ai",
  url: "https://arxiv.org/html/2509.14233",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const ts=tables(await fetchText(FEED));const out:LeaderboardRow[]=[];
    for(const t of ts){
      const h=t[1];if(h?.[0]?.text!=='Model')continue;
      const col=h.findIndex(c=>/^Switzerland\s*QA/.test(c.text));if(col<0)continue;
      for(const r of t.slice(2)){const score=num(r[col]?.text??'');if(score===undefined)continue;
        const model=r[0].text.replace(/^\\Block\s*\[[^\]]+\]\d+-\d+\s*/,'');
        out.push({model:h.length===9?model+' (pretrained checkpoint)':model,score,setting:h.length===9?'Pretrained evaluation':'Instruction-tuned evaluation'});}
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
