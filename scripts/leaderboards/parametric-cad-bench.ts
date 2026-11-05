// Parametric CAD Bench (gNucleus). cadbench.ai is server-rendered (Next.js) and shows the V3 leaderboard as
// an HTML table: Rank | Model (with effort) | Agent | Create | Create + Edit | Image-to-CAD | Overall |
// Cost (USD). Overall (0 to 100) is the score and the agent is the harness. Cost is the US dollars for the
// whole run of 100 tasks ("Costs are reported for the full cohort", /cad-bench/leaderboard), so costPer is 'run'.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://cadbench.ai/';

const board: Leaderboard = {
  benchmark: 'parametric-cad-bench',
  url: URL,
  feed: `${URL} (server-rendered HTML table, V3 Overall)`,
  terms: 'Server-rendered public page; the site publishes no robots.txt and no terms, and the submission repository is public.',
  costPer: 'run',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Overall'));
    if (!t) throw new Error('CAD Bench table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iAgent, iScore, iCost] = ['Model', 'Agent', 'Overall', 'Cost (USD)'].map((h) => head.indexOf(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const cell = r[iModel]?.text ?? '';
      const effort = cell.match(/\s*\(\s*([\w-]+)\s*\)$/);
      const score = num(r[iScore]?.text);
      if (!cell || score === undefined) continue;
      rows.push({
        model: effort ? cell.slice(0, effort.index).trim() : cell,
        score,
        setting: effort ? effort[1].toLowerCase() : undefined,
        harness: r[iAgent]?.text || undefined,
        cost: num(r[iCost]?.text),
      });
    }
    return rows;
  },
};
export default board;
