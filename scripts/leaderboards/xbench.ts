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
    board.parts = {};
    type Counts = {n:number;positive:number;negative:number;mixed:number;net_sentiment:number|null};
    return d.sentiment.models.filter((r:any)=>r.firsthand?.n>0 && typeof r.firsthand.net_sentiment==='number').map((r:any)=>{
      const metrics:Record<string,number> = {votes:r.firsthand.n,positive:r.firsthand.positive,negative:r.firsthand.negative,mixed:r.firsthand.mixed};
      const add = (key:string, counts:Counts) => {
        if (!counts?.n || typeof counts.net_sentiment !== 'number') return;
        metrics[key] = counts.net_sentiment * 100;
        metrics[key+'Votes'] = counts.n;
        metrics[key+'Positive'] = counts.positive;
        metrics[key+'Negative'] = counts.negative;
        metrics[key+'Mixed'] = counts.mixed;
      };
      add('allExpressed', r.all_expressed);
      add('endorsements', r.endorsements);
      for (const [name, counts] of Object.entries(r.dimensions ?? {}) as [string,Counts][]) {
        const key = 'dimension' + name[0].toUpperCase() + name.slice(1);
        add(key, counts);
        if (key in metrics) board.parts![key] = {name,group:'Dimension'};
      }
      for (const week of d.window.weeks ?? []) {
        const key = 'week' + week.id.replace(/^w/,'');
        add(key, r.by_window?.[week.id]);
        if (key in metrics) board.parts![key] = {name:String(week.label).replace(/\s*[–—-]\s*/g, ' to '),group:'Week'};
      }
      for (const [name,count] of Object.entries(r.tasks ?? {})) {
        if (typeof count === 'number') metrics[name+'Mentions'] = count;
      }
      return {model:r.model,score:r.firsthand.net_sentiment*100,date:d.window.end.slice(0,10),metrics};
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
