// Multi-LCB: the main table’s published Avg pass@1 across twelve languages.
// Language scores remain metrics. The paper’s reasoning effort labels are whole-suite configurations.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2606.20517";
const board: Leaderboard = {
  benchmark: "multi-lcb",
  url: "https://arxiv.org/html/2606.20517",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.[1]?.text==='Python'&&t[0]?.at(-1)?.text==='Avg');
    if(!t)throw new Error('Multi-LCB main table missing');
    return t.slice(1).filter(r=>r.length===14).map(r=>{
      const label=r[0].text.replace(/\*/g,'');const effort=label.match(/\s*\((Medium|Low)\)$/i);
      return {model:label.replace(/\s*\((Medium|Low)\)$/i,''),setting:effort?.[1].toLowerCase(),score:num(r[13].text)!,metrics:Object.fromEntries(t[0].slice(1,13).map((c,i)=>[c.text,num(r[i+1].text)!]))};
    });
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
