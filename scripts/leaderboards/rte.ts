// RTE on the GLUE board. gluebenchmark.com is a React app that reads its leaderboard from the public Firebase
// Realtime Database behind it (mtl-sentence-representations). The page takes the newest dated snapshot under
// leaderboard/glue (one row per team, with that team's best submission) and hides rows whose overall score is
// under 70. This file reads the same snapshot through Firebase REST. The score is the RTE column, accuracy on
// the GLUE RTE test set. Rows carry the submission date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const DB = 'https://mtl-sentence-representations.firebaseio.com';
const FEED = `${DB}/leaderboard/glue.json?orderBy="$key"&limitToLast=1`;

interface Row {
  maxScore: number | string;
  maxScoreSubmission?: {
    createdOn: number;
    editable?: { name?: string };
    tasks?: Record<string, { accuracy?: number; score?: number }>;
  };
}

const board: Leaderboard = {
  benchmark: 'rte',
  url: 'https://gluebenchmark.com/leaderboard',
  feed: `${DB}/leaderboard/glue.json (newest snapshot, Firebase REST), task RTE accuracy`,
  terms: 'gluebenchmark.com robots.txt sets no rules (content-signal comments only); the Firebase host robots.txt allows *.json; the site publishes no terms.',
  aliases: {
    // the T5 team's entry is the 11B model
    T5: 't5-11b',
  },
  async fetch() {
    const [snap, tasks] = await Promise.all([
      fetchJson<Record<string, Row[]>>(FEED),
      fetchJson<Record<string, { identifier: string }>>(`${DB}/tasks.json`),
    ]);
    const rte = Object.entries(tasks).find(([, t]) => t.identifier === 'RTE')?.[0];
    const list = Object.values(snap)[0];
    if (!rte || !Array.isArray(list) || list.length < 50) throw new Error('GLUE snapshot or RTE task not found');
    const rows: LeaderboardRow[] = [];
    for (const r of list) {
      if (typeof r.maxScore === 'number' && r.maxScore * 100 < 70) continue;
      const s = r.maxScoreSubmission;
      const acc = s?.tasks?.[rte]?.accuracy;
      const model = s?.editable?.name?.trim();
      if (!s || !model || typeof acc !== 'number') continue;
      rows.push({ model, score: Number((acc * 100).toFixed(2)), date: new Date(s.createdOn).toISOString().slice(0, 10) });
    }
    return rows;
  },
};
export default board;
