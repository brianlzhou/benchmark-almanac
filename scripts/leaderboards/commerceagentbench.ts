// CommerceAgentBench (Accio, Alibaba International; formerly RealReplicaBench). The static page carries its
// leaderboard data inline as <script id="rrb-data" type="application/json">: one row per model and harness
// (Pi, OpenClaw, Accio) on all 107 tasks, with pass_rate (percent of tasks passed), passed, capacity,
// steps, time, tokens and avg_cost_usd. The board shows one table per harness ranked by pass rate, so every
// row is kept with its harness, and pass_rate is the score; avg_cost_usd is the mean cost of one task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const PAGE = 'https://commerce-agent-bench.site.accio.ai/';

interface Row {
  model: string;
  harness_label?: string;
  pass_rate: number;
  avg_cost_usd?: number;
}

const board: Leaderboard = {
  benchmark: 'commerceagentbench',
  url: PAGE,
  feed: `${PAGE} (inline script#rrb-data JSON, rows[].pass_rate)`,
  terms: 'Static page on Accio\'s public object storage (no robots.txt); the page states no terms and releases its task replicas under an open license.',
  async fetch() {
    const html = await fetchText(PAGE);
    const at = html.indexOf('<script id="rrb-data" type="application/json">');
    if (at < 0) throw new Error('rrb-data block not found');
    const data = jsonAt<{ rows: Row[] }>(html, html.indexOf('{', at));
    const rows: LeaderboardRow[] = [];
    for (const r of data.rows ?? []) {
      if (!r.model || !Number.isFinite(r.pass_rate)) continue;
      rows.push({ model: r.model, score: r.pass_rate, harness: r.harness_label, cost: r.avg_cost_usd });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} CommerceAgentBench rows`);
    return rows;
  },
};
export default board;
