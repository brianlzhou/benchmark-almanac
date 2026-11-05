// ResearchClawBench (Intern Science, 40 research tasks across 10 domains). The GitHub Pages site renders
// data/leaderboard.json: per agent system and task, a rubric score (0 to 100), the model behind the run and
// its cost. The page opens in Pass@1 mode and scores each agent as the mean over its scored tasks
// (unscored tasks are left out, as the page's averageEntry does); that mean is the score here, and the
// mean cost per task is kept. The mean run time per task (duration_seconds) is metrics.time, in seconds.
// Each agent runs one model. The agent name is the harness, without the model that "ResearchHarness
// (GPT-5.5)" repeats in brackets. Pass@5 (pass5_leaderboard.json) is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://internscience.github.io/ResearchClawBench-Home/data/leaderboard.json';

interface Entry {
  score?: number;
  cost_usd?: number;
  duration_seconds?: number;
  model_display?: string;
}

const board: Leaderboard = {
  benchmark: 'researchclawbench',
  url: 'https://internscience.github.io/ResearchClawBench-Home/',
  feed: `${FEED} (Pass@1)`,
  terms: 'Static JSON on the ResearchClawBench GitHub Pages site, which states no separate terms; the repository is MIT.',
  aliases: {
    // "Codex GPT-5.6-Sol": the model run inside Codex
    'Codex GPT-5.6-Sol': 'gpt-5-6-sol',
  },
  async fetch() {
    const data = await fetchJson<{ agents: string[]; scores: Record<string, Record<string, Entry>> }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const agent of data.agents) {
      const entries = Object.values(data.scores[agent] ?? {});
      const scored = entries.filter((e) => Number.isFinite(e.score));
      const model = entries.find((e) => e.model_display)?.model_display;
      if (!model || !scored.length) continue;
      const costs = entries.map((e) => e.cost_usd).filter((c): c is number => Number.isFinite(c));
      const times = entries.map((e) => e.duration_seconds).filter((t): t is number => Number.isFinite(t) && t! > 0);
      rows.push({
        model,
        harness: agent.endsWith(` (${model})`) ? agent.slice(0, -model.length - 3) : agent,
        score: scored.reduce((s, e) => s + e.score!, 0) / scored.length,
        cost: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : undefined,
        metrics: times.length ? { time: times.reduce((a, b) => a + b, 0) / times.length } : undefined,
      });
    }
    return rows;
  },
};
export default board;
