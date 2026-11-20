// Two automatic estimators of the same full biography set, not separate question subsets.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { uncertain } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://raw.githubusercontent.com/shmsw25/FActScore/HEAD/README.md';
export default {
  benchmark:'factscore',url:'https://github.com/shmsw25/FActScore',feed,
  terms:'The FActScore authors publish this results table in their public repository; robots.txt permits the raw README path.',
  async fetch():Promise<LeaderboardRow[]> {
    const t=markdownTables(await fetchText(feed)).find(t=>t[0].some(c=>c==='FActScore from (A)'));
    if(!t || t[0].length!==5)throw new Error('FActScore columns changed');
    const rows:LeaderboardRow[]=[];
    for(const r of t.slice(1))for(const [i,setting] of [[3,'estimator A'],[4,'estimator B']] as const){
      const score=num(r[i]);if(score===undefined)continue;
      rows.push({model:uncertain(r[0]),score,setting,metrics:{respondPercent:num(r[1])!,facts:num(r[2])!}});
    }
    if(rows.length<6)throw new Error('FActScore model scores missing');
    return rows;
  },
} satisfies Leaderboard;
