// PDEAgent-Bench ranks solvers by pass rate on each finite element backend. The project publishes the same leaderboard data that its web bundle displays.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Run {model: string; provider: string; agent?: string; date: string; backend: string; passRate: number; costPer1K?: number; pdeScores: Record<string, number>}

const feed = "https://raw.githubusercontent.com/zeroeclipse00/pde-agent-bench-github-pages/main/web/server/app/data/mock.json";
const board: Leaderboard = {
  benchmark: 'pdeagent-bench',
  url: "https://zeroeclipse00.github.io/pde-agent-bench-github-pages/",
  feed,
  terms: "Neither host has a robots file. The dataset uses CC BY 4.0. The project site gives no separate license for leaderboard scores. https://huggingface.co/datasets/eclipse00/PDEAgent-Bench https://zeroeclipse00.github.io/pde-agent-bench-github-pages/",
  harnesses: 'system',
  aliases: { 'Opus 4.7': 'claude-opus-4-7' },
  async fetch() {
    const data = await fetchJson<{leaderboard: Run[]; pdeTypes: {id: string; name: string}[]}>(feed);
    if (data.leaderboard.length < 24 || data.pdeTypes.length < 11) throw new Error('Incomplete PDEAgent standings');
    board.parts = Object.fromEntries(data.pdeTypes.map(t => [t.id, t.name]));
    return data.leaderboard.map(r => {
      const model = r.agent ? r.provider.split('·')[1]?.trim() : r.model;
      if (!model || !r.backend || !Number.isFinite(r.passRate) || !Object.keys(r.pdeScores).length) throw new Error('Missing PDEAgent run');
      return { model, harness: r.agent || undefined, setting: r.date || r.backend, score: r.passRate,
        cost: r.costPer1K == null ? undefined : r.costPer1K / 1000, metrics: r.pdeScores };
    });
  },
};
export default board;
