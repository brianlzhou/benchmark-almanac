// UNO-Bench: the official leaderboard ranks omni models by its published Omni-Avg.
// Audio, visual, Omni-MC and Omni-MO scores remain metrics. Read the current application asset as data.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://meituan-longcat.github.io/UNO-Bench/";
const board: Leaderboard = {
  benchmark: "uno-bench",
  url: "https://meituan-longcat.github.io/UNO-Bench/",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const html=await fetchText(FEED);const path=html.match(/src="([^"]*assets\/index-[^"]+\.js)"/)?.[1];if(!path)throw new Error('UNO asset missing');
    await new Promise(r=>setTimeout(r,1100));const s=await fetchText(new URL(path,FEED).href);
    const marker=s.indexOf('omniMC:');const start=s.lastIndexOf('[{model:',marker);if(start<0)throw new Error('UNO data missing');
    const d=jsLiteral<{model:string,audio:number,visual:number,omniMC:number,omniMO:number,omniAvg:number}[]>(s,start);
    return d.map(r=>({model:r.model,score:r.omniAvg,metrics:{audio:r.audio,visual:r.visual,omniMC:r.omniMC,omniMO:r.omniMO}}));
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
