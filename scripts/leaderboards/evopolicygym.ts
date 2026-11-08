// EvoPolicyGym's paper publishes a Core16 rank-normalized score across all sixteen environments.
// Table 2: "Family and Core16 scores are macro-averages of per-environment rank scores".
// Read the printed Core16 column directly, on its native 0-1 scale. Higher is better.
// These paper-era results are static and are not the newer open submission board.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const FEED = 'https://arxiv.org/html/2607.02440';
const board: Leaderboard = {
  benchmark: 'evopolicygym', url: FEED, feed: FEED,
  terms: 'The authors publish these historical results on arXiv. Credit the EvoPolicyGym authors.',
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Core16'));
    if (!t) throw new Error('Core16 aggregate table missing');
    const head=t[0].map(c=>c.text), at=head.indexOf('Core16');
    const rows:LeaderboardRow[]=[];
    for(const r of t.slice(1)) {
      const model=r[0]?.text,score=num(r[at]?.text);
      if(!model || /random policy/i.test(model) || score===undefined)continue;
      const metrics:Record<string,number>={};
      for(let i=2;i<head.length;i++){const n=num(r[i]?.text);if(n!==undefined && i!==at)metrics[head[i]]=n;}
      rows.push({model,score,harness:r[1].text,setting:'128 episode budget',metrics});
    }
    if(!rows.length)throw new Error('No Core16 aggregate rows');
    return rows;
  },
};
export default board;
