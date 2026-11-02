// Embodied First Exam. www.embodied-first-exam.ai is a client-rendered page that reads data/exam.json. Its
// leaderboard section (leaderboard.shared) lists the ranked runs and, per view, solved and total tests; the
// "core" view counts each of the 444 core tasks once in its default mode. The score is the core view's solve
// rate (percent). Each run in exam.json names the model, the coding-agent harness and the reasoning effort,
// plus an estimated spend over its attempts, which gives the cost per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://www.embodied-first-exam.ai/';
const FEED = `${PAGE}data/exam.json`;

interface Exam {
  runs: { id: string; model: string; harness?: string; effort?: string; est_usd?: number; est_n?: number }[];
  leaderboard: { shared: { runs: string[]; views: { core?: { scores: Record<string, [number, number]> } } } };
}

const board: Leaderboard = {
  benchmark: 'embodied-first-exam',
  url: PAGE,
  feed: `${FEED} (leaderboard.shared.views.core)`,
  terms: 'Static JSON the site itself loads; robots.txt allows all paths and the site states no other terms.',
  async fetch() {
    const exam = await fetchJson<Exam>(FEED);
    const core = exam.leaderboard?.shared?.views?.core?.scores;
    if (!core) throw new Error('core view not found');
    const runs = new Map(exam.runs.map((r) => [r.id, r]));
    const rows: LeaderboardRow[] = [];
    for (const id of exam.leaderboard.shared.runs) {
      const run = runs.get(id);
      const s = core[id];
      if (!run || !s || !s[1]) continue;
      rows.push({
        model: run.model,
        score: Number(((s[0] / s[1]) * 100).toFixed(2)),
        setting: run.effort?.toLowerCase(),
        harness: run.harness,
        cost: run.est_usd && run.est_n ? run.est_usd / run.est_n : undefined,
      });
    }
    if (rows.length < 3) throw new Error(`only ${rows.length} Embodied First Exam rows`);
    return rows;
  },
};
export default board;
