// SEC-bench Pro, snapshot 260617 (344 instances: 103 V8, 104 SpiderMonkey, 137 Linux). sec-bench.github.io
// renders data/results.json, which holds one snapshot per release; 260617 is the board default and the
// only one this id covers. Its "overall" leaderboard lists per agent, model and effort the headline score
// (solved over all instances, 0 to 100). The agent is the harness and the effort the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://sec-bench.github.io/data/results.json';
const SNAPSHOT = '260617';

interface Result {
  agent?: string;
  model: string;
  effort?: string;
  date?: string;
  resolved?: number;
  score_modes?: { headline?: { score?: number } };
}

const board: Leaderboard = {
  benchmark: 'sec-bench-pro-260617',
  url: 'https://sec-bench.github.io',
  feed: `${FEED} (snapshot ${SNAPSHOT}, overall)`,
  terms: 'Static JSON on the SEC-bench GitHub Pages site, whose repository is Apache-2.0; the SEC-bench Pro repository is MIT.',
  aliases: {},
  async fetch() {
    const data = await fetchJson<{ snapshots: Record<string, { leaderboards: { is_overall?: boolean; results: Result[] }[] }> }>(FEED);
    const overall = data.snapshots[SNAPSHOT]?.leaderboards.find((l) => l.is_overall);
    if (!overall) throw new Error(`no overall board in SEC-bench snapshot ${SNAPSHOT}`);
    const rows: LeaderboardRow[] = [];
    for (const r of overall.results) {
      const score = r.score_modes?.headline?.score ?? r.resolved;
      if (typeof score !== 'number') continue;
      rows.push({ model: r.model, score, setting: r.effort?.toLowerCase() || undefined, harness: r.agent, date: r.date });
    }
    return rows;
  },
};
export default board;
