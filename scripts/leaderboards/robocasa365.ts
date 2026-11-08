// RoboCasa365. robocasa.ai/leaderboard (GitHub Pages, built from github.com/robocasa-benchmark/leaderboard)
// carries the standard-track board as a static HTML table: per policy the type, submitter, Overall
// (the board's weighted success score and its ranking) and success rates on atomic-seen, composite-seen and
// composite-unseen tasks. Overall is the score. Entries are robot policies; the resolver keeps those with a
// model record (π0, π0.5, GR00T baselines run by the RoboCasa team).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://robocasa.ai/leaderboard';

const board: Leaderboard = {
  benchmark: 'robocasa365',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Overall)`,
  terms: 'Static leaderboard page on GitHub Pages (no robots.txt rules); the submissions repository states no license and the site states no terms.',
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => c.text === 'Overall') && rows[0]?.some((c) => c.text === 'Model'));
    if (!t) throw new Error('leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const iModel = head.indexOf('Model');
    const iOverall = head.indexOf('Overall');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[iModel]?.text;
      const score = num(r[iOverall]?.text);
      if (model && score !== undefined){
        const metrics:Record<string,number>={};for(const key of ['Atomic-Seen','Composite-Seen','Composite-Unseen']){const v=num(r[head.indexOf(key)]?.text);if(v!==undefined)metrics[key]=v;}
        rows.push({model,score,setting:'type '+r[head.indexOf('Type')]?.text,metrics});
      }
    }
    return rows;
  },
};
export default board;
