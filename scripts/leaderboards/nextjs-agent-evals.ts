// Next.js Agent Evals (Vercel). nextjs.org/evals is server-rendered with two HTML tables: "Current evals"
// (latest agents, rerun whenever the evals change) and "Previously measured" (superseded agents, not
// rerun). The importer reads the current table: Success Rate (without AGENTS.md, 0 to 100) is the score,
// the agent the harness, the effort in brackets the setting, and Avg cost (once "Avg List Cost": US dollars
// per eval at public model prices, including cache pricing) is kept. Avg Duration, the recorded run time of
// one eval in seconds, is metrics.latency.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://nextjs.org/evals';

const board: Leaderboard = {
  benchmark: 'nextjs-agent-evals',
  url: URL,
  feed: `${URL} (server-rendered table "Current evals", Success Rate)`,
  terms: 'Server-rendered public page on nextjs.org (Vercel); the site publishes no robots.txt and the Vercel terms do not restrict reading it.',
  aliases: {},
  async fetch() {
    const [t] = tables(await fetchText(URL)).filter((rows) => rows[0]?.some((c) => c.text === 'Success Rate'));
    if (!t) throw new Error('Next.js evals table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iAgent, iScore, iTime] = ['Model', 'Agent', 'Success Rate', 'Avg Duration'].map((h) => head.indexOf(h));
    const iCost = head.findIndex((h) => /^Avg (List )?cost$/i.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const cell = r[iModel]?.text ?? '';
      const effort = cell.match(/\s*\(([\w-]+)\)$/);
      const score = num(r[iScore]?.text);
      if (!cell || score === undefined) continue;
      rows.push({
        model: effort ? cell.slice(0, effort.index).trim() : cell,
        score,
        setting: effort?.[1].toLowerCase(),
        harness: r[iAgent]?.text || undefined,
        cost: num(r[iCost]?.text),
        metrics: /^[\d.]+s$/.test(r[iTime]?.text ?? '') ? { latency: num(r[iTime].text)! } : undefined,
      });
    }
    return rows;
  },
};
export default board;
