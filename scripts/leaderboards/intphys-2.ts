// IntPhys 2: the paper’s Overall accuracy on its main evaluation set, in percent.
// Easy, medium, hard and held-out accuracy remain secondary metrics.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2506.09849";
const board: Leaderboard = {
  benchmark: "intphys-2",
  url: "https://arxiv.org/html/2506.09849",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Held Out')&&t[0]?.some(c=>c.text==='Overall'));
    if(!t)throw new Error('IntPhys Overall table missing');
    return t.slice(1).filter(r=>r[0].text!=='Human').map(r=>({model:r[0].text.replace(/\s*\(.*$/,'').replace(/\s+(?:Wang|Agarwal|Bardes|Assran).*$/,'').replace('GPT4-o','GPT-4o').replace('Qwen-VL 2.5','Qwen-VL 2.5 (size unspecified)'),score:num(r[5].text)!,metrics:Object.fromEntries(['easy','medium','hard','heldOut'].map((k,i)=>[k,num(r[[2,3,4,6][i]].text)!]))}));
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
