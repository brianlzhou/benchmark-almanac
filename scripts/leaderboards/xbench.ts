// Xbench's default Firsthand stance board ranks models by net sentiment.
// The published net_sentiment is a signed fraction. Scores use percentage points, including negative values.
// The importer reads the maker's public summary only. It never requests X or Twitter hosts.
// Harness sentiment and per-week results are separate views, not additional rows.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://media.offpolicyinc.com/xbench/data/labels-v3/public-summary.json?v=2026-09-28a";
const board: Leaderboard = {
  benchmark: "xbench",
  url: "https://offpolicyinc.com/work/xbench/app/",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const d=await fetchJson(FEED) as any;
    if(!Array.isArray(d.sentiment?.models))throw new Error('Missing model sentiment');
    return d.sentiment.models.filter((r:any)=>r.firsthand?.n>0 && typeof r.firsthand.net_sentiment==='number').map((r:any)=>({model:r.model,score:r.firsthand.net_sentiment*100,
      date:d.window.end.slice(0,10),metrics:{votes:r.firsthand.n,positive:r.firsthand.positive,negative:r.firsthand.negative,mixed:r.firsthand.mixed}}));
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
