// Realtime-Bench. realtimeagents.org draws its leaderboard in the browser from /data/leaderboard.json.gz, a gzipped
// JSON file: {snapshotDate, protocol, entries:[{name, effort, solved, total, score, cohort, ...}]}. `score` is the
// percentage of the 50 tasks solved in one Wall Clock run, the number the page shows. The paper's tables average
// three runs instead, so its numbers differ slightly. Jev was run on the 30 web tasks only, with text input.
import { gunzipSync } from 'node:zlib';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://realtimeagents.org/data/leaderboard.json.gz';

interface Entry {
  name: string;
  effort?: string;
  score: number;
  solved: number;
  total: number;
  cohort?: string;
}

const board: Leaderboard = {
  benchmark: 'realtime-bench',
  url: 'https://realtimeagents.org/#/leaderboard',
  feed: FEED,
  terms: 'realtimeagents.org publishes no robots.txt or terms, and the project code is MIT-licensed (github.com/RealtimeAgents/Realtime-Bench).',
  aliases: {},
  async fetch() {
    const res = await fetch(FEED, { headers: { 'user-agent': 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)' }, signal: AbortSignal.timeout(45_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${FEED}`);
    const raw = Buffer.from(await res.arrayBuffer());
    // the server may already have decompressed it
    const d = JSON.parse((raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw) : raw).toString('utf8')) as { snapshotDate?: string; entries?: Entry[] };
    const rows: LeaderboardRow[] = [];
    for (const e of d.entries ?? []) {
      if (!Number.isFinite(e.score) || !e.total) continue;
      // "fixed" and "official" mark models with no effort setting
      const setting = e.effort && !/^(fixed|official|default)$/i.test(e.effort) ? e.effort : undefined;
      rows.push({ model: e.name, score: e.score, setting, harness: e.cohort === 'jev-web-30' ? 'web tasks only, text input' : undefined, date: d.snapshotDate });
    }
    if (!rows.length) throw new Error('no entries in the leaderboard file');
    return rows;
  },
};
export default board;
