// AVMeme Exam: the published AVG across all question types, in percent.
// Sound and question-type scores remain metrics. Undated audio model labels remain unlisted.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://avmemeexam.github.io/public/";
const board: Leaderboard = {
  benchmark: "avmeme-exam",
  url: "https://avmemeexam.github.io/public/",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const data=jsonAfter<Record<string,Record<string,number>>>(await fetchText(FEED),'const modelPerfData =');
    return Object.entries(data).map(([model,r])=>({model:model==='GPT-4o Audio'?model+' (snapshot unspecified)':model,score:r.AVG,metrics:Object.fromEntries(Object.entries(r).filter(([k])=>k!=='AVG'))}));
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
