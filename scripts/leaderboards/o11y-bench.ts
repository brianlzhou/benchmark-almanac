// o11y-bench (Grafana observability tasks) on o11ybench.ai. The full board, /leaderboard (the home page shows
// only the top 10), is static HTML whose first table is: # | Model | Effort | Pass^3 | Pass@3 | Solved | Cost / trial | Tokens / trial | Date. The page ranks by
// Pass^3 (solved in all three trials, 0 to 100), which is the score. Cost per trial is the cost of one task
// attempt, and Tokens per trial counts input too, so it is kept as totalTokens rather than output tokens. Pass@3 (solved in at least one of the three
// trials) is kept as `passAt3`. Open-weight models carry an "Open" badge after the name, which we retain. The
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
  parts: {
    Dashboards: { name: 'Dashboards', group: 'Task category' },
    'Grafana API': { name: 'Grafana API', group: 'Task category' },
    Investigation: { name: 'Investigation', group: 'Task category' },
    Logs: { name: 'Logs', group: 'Task category' },
    Metrics: { name: 'Metrics', group: 'Task category' },
    Traces: { name: 'Traces', group: 'Task category' },
  },
  stats: {
    passAt3: { name: 'pass@3', unit: '%', better: 'higher' },
    totalTokens: { name: 'Total tokens per trial', unit: 'tokens' },
    solved: { name: 'Solved trials', unit: 'count' },
  },
  async fetch(){
    const html = await fetchText(URL);
    const attrs = new Map([...html.matchAll(/<tr\b([^>]*data-rank="(\d+)"[^>]*)>/g)].map(m =>
      [m[2], Object.fromEntries([...m[1].matchAll(/data-([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]))]));
    const ts=tables(html);const t=ts.find(t=>t[0]?.some(c=>/^Tokens \/ trial/.test(c.text)));
    if(!t)throw new Error('Missing o11y ranking table');const rows:LeaderboardRow[]=[];
    const categories = ts.find(table => table[0]?.some(c => c.text === 'Dashboards'));
    for(const r of t.slice(1)){
      const model=text(r[1].html.replace(/<span[^>]*title="Open-weight model"[^>]*>[\s\S]*?<\/span>/g,''));
      const score=num(r[3]?.text);if(!model||score===undefined)continue;
      const metrics:Record<string,number>={};const pass=num(r[4]?.text);if(pass!==undefined)metrics.passAt3=pass;
      const usage=r[7]?.text.match(/^([\d.]+)\s*([kKmM]?)$/);if(usage)metrics.totalTokens=Number(usage[1])*({k:1000,m:1000000}[usage[2].toLowerCase()]??1);
      const rank = r[0].text;
      const raw = attrs.get(rank);
      const detail = categories?.find(c => c[0].text === rank && c[1].html.includes('title="' + model + '"'));
      detail?.slice(2).forEach((cell, i) => {
        const value = num(cell.text);
        if (value !== undefined) metrics[categories![0][i + 2].text] = value;
      });
      const counts = r[5]?.text.match(/^(\d+)\/(\d+)$/);
      if (counts) metrics.solved = Number(counts[1]);
      if (raw?.avg_total_tokens_per_trial) metrics.totalTokens = Number(raw.avg_total_tokens_per_trial);
      rows.push({model,score, trials: 3, open: raw ? raw['open-weight'] === 'true' : undefined, setting:r[2]?.text||undefined,cost:raw?.avg_cost_per_trial_usd ? Number(raw.avg_cost_per_trial_usd) : num(r[6]?.text),date:r[8]?.text,metrics});
    }return rows;
  },
};
export default board;
