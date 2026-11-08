// o11y-bench (Grafana observability tasks) on o11ybench.ai. The full board, /leaderboard (the home page shows
// only the top 10), is static HTML whose first table is: # | Model | Effort | Pass^3 | Pass@3 | Solved | Cost / trial | Tokens / trial | Date. The page ranks by
// Pass^3 (solved in all three trials, 0 to 100), which is the score. Cost per trial is the cost of one task
// attempt, and Tokens per trial counts input too, so it is kept as totalTokensPerTrial rather than output tokens. Pass@3 (solved in at least one of the three
// trials) is kept as `passAt3`. Open-weight models carry an "Open" badge after the name, which is dropped. The
// reader parses the full ranking table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { text, tables, num } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://o11ybench.ai/leaderboard';

const board: Leaderboard = {
  benchmark: 'o11y-bench',
  url: URL,
  feed: `${URL} (leaderboard table, Pass^3)`,
  terms: 'Static public page; the site has no robots.txt and no terms, and the o11y-bench repository (grafana/o11y-bench) is public.',
  aliases: {},
  chart:{title:'Pass^3 vs. cost',x:{key:'cost',label:'Cost per trial',unit:'$',better:'lower'},y:{key:'score',label:'Pass^3',unit:'%',better:'higher'}},
  async fetch(){
    const ts=tables(await fetchText(URL));const t=ts.find(t=>t[0]?.some(c=>/^Tokens \/ trial/.test(c.text)));
    if(!t)throw new Error('Missing o11y ranking table');const rows:LeaderboardRow[]=[];
    for(const r of t.slice(1)){
      const model=text(r[1].html.replace(/<span[^>]*title="Open-weight model"[^>]*>[\s\S]*?<\/span>/g,''));
      const score=num(r[3]?.text);if(!model||score===undefined)continue;
      const metrics:Record<string,number>={};const pass=num(r[4]?.text);if(pass!==undefined)metrics.passAt3=pass;
      const usage=r[7]?.text.match(/^([\d.]+)\s*([kKmM]?)$/);if(usage)metrics.totalTokensPerTrial=Number(usage[1])*({k:1000,m:1000000}[usage[2].toLowerCase()]??1);
      rows.push({model,score,setting:r[2]?.text||undefined,cost:num(r[6]?.text),date:r[8]?.text,metrics});
    }return rows;
  },
};
export default board;
