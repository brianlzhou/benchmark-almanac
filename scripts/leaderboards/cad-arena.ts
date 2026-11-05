// CAD Arena (Normal). normalfactory.com/leaderboard/cad-arena is server-rendered (Next.js) with one HTML
// table: Model (name, then maker) | Score (0 to 1, the ranking) | Harness | Cost | Tokens | Turns | Scored.
// Score is the score (in the board's 0 to 1 unit) and the harness kept. The page says cost and tokens are
// means for one scored trial: Cost (US dollars) is the cost. Tokens include input and exclude cache reads, so
// they are not output tokens and are not kept. Turns (mean per trial) is metrics.turns, and the bar's label
// gives the bootstrap 95% interval, kept as metrics.ciLow and ciHigh (0 to 1).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://normalfactory.com/leaderboard/cad-arena';

const board: Leaderboard = {
  benchmark: 'cad-arena',
  url: URL,
  feed: `${URL} (server-rendered HTML table, Score)`,
  terms: 'Server-rendered public page; robots.txt allows all paths (content signals: search yes, AI training no, use reference) and the site states no terms.',
  aliases: {
    // the board lists GPT-6 Astra by its short name
    Astra: 'gpt-6-astra',
    'DeepSeek V4': 'deepseek-v4-pro',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Score'));
    if (!t) throw new Error('CAD Arena table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iScore, iHarness, iCost, iTurns] = ['Model', 'Score', 'Harness', 'Cost', 'Turns'].map((h) => head.indexOf(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      // the name is the first text block. The maker follows in its own element
      const name = r[iModel]?.html.split(/<\/(?:span|div|p|a)>/i).map(text).find(Boolean);
      const score = num(r[iScore]?.text);
      if (!name || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const turns = num(r[iTurns]?.text);
      if (turns !== undefined) metrics.turns = turns;
      // aria-label "CAD Arena score 0.754, 95 percent interval 0.706 to 0.795, ..."
      const ci = r.map((c) => c.html).join('').match(/95 percent interval ([\d.]+) to ([\d.]+)/);
      if (ci) Object.assign(metrics, { ciLow: Number(ci[1]), ciHigh: Number(ci[2]) });
      rows.push({
        model: name,
        score,
        harness: r[iHarness]?.text || undefined,
        cost: num(r[iCost]?.text.replace('$', '')),
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
