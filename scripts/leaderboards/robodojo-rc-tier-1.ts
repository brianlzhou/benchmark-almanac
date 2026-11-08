// RoboDojo RC Tier 1 (Robocurve): six real robot tasks on I2RT YAM arms, 20 attempts each, run by Robocurve
// on its own rigs. robocurve.org/all-runs/ loads one content-hashed export (runs.<hash>.json, found in the
// page each run) with every trial: benchmark, model, effort, serving mode, rubric score (0 to 1), cost and
// the leaderboards the trial counts toward. The "Robot-task performance" board takes the trials marked
// "capability" for this benchmark and shows each group's mean score; the importer averages the same trials
// and includes Pareto-only configurations. It averages
// per model, effort and mode (0 to 100) and keeps the mean cost per trial. Tool-calling LLMs and robot
// policies (VLAs) share the board; the policies are not in the registry and stay unmatched.
// The mean of each trial's minutes is metrics.latency (seconds per attempt), the x-axis of the home page's
// "Robotics Capabilities vs Time" chart. Output tokens (usage.output) are kept only for groups where every
// trial reports them.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const PAGE = 'https://robocurve.org/all-runs/';
const BENCHMARK = 'robodojo-rc-tier-1';

interface Trial {
  benchmark: string;
  model: string;
  effort?: string;
  mode?: string;
  score?: number;
  cost?: number | null;
  minutes?: number | null;
  usage?: { output?: number } | null;
  leaderboard?: string[];
}

const board: Leaderboard = {
  benchmark: BENCHMARK,
  url: `${PAGE}?leaderboard=capability&benchmark=${BENCHMARK}`,
  feed: `${PAGE}runs.<hash>.json (trials on the capability and Pareto boards)`,
  terms: 'Public run export of robocurve.org; robots.txt allows all paths (content signals: search yes, AI training no) and the site states no other terms.',
  chart: {
    title: 'Robotics Capabilities vs Time',
    note: 'Mean score against wall-clock time per task attempt, 120 attempts per configuration; robot policies (VLAs) always run to their 3,600-step cap.',
    x: { key: 'latency', label: 'Time per task attempt', unit: 's', better: 'lower', log: true },
    y: { key: 'score', label: 'Mean score', unit: '%', better: 'higher' },
  },
  aliases: {},
  async fetch() {
    const html = await fetchText(PAGE);
    const file = html.match(/runs\.[0-9a-f]+\.json/)?.[0];
    if (!file) throw new Error('no runs export named on the Robocurve all-runs page');
    const data = await fetchJson<{ models?: Record<string, string>; runs: Trial[] }>(new URL(file, PAGE).href);
    type Group = { t: Trial; n: number; sum: number; cost: number; costs: number; min: number; mins: number; out: number; outs: number };
    const groups = new Map<string, Group>();
    for (const t of data.runs) {
      if (t.benchmark !== BENCHMARK || !t.leaderboard?.some(x => x === 'capability' || x === 'pareto') || typeof t.score !== 'number') continue;
      const key = [t.model, t.effort ?? '', t.mode ?? ''].join('|');
      const g = groups.get(key) ?? { t, n: 0, sum: 0, cost: 0, costs: 0, min: 0, mins: 0, out: 0, outs: 0 };
      g.n++;
      g.sum += t.score;
      if (typeof t.minutes === 'number') {
        g.min += t.minutes;
        g.mins++;
      }
      if (typeof t.usage?.output === 'number') {
        g.out += t.usage.output;
        g.outs++;
      }
      if (typeof t.cost === 'number') {
        g.cost += t.cost;
        g.costs++;
      }
      groups.set(key, g);
    }
    const rows: LeaderboardRow[] = [];
    for (const { t, n, sum, cost, costs, min, mins, out, outs } of groups.values()) {
      rows.push({
        model: data.models?.[t.model] ?? t.model,
        score: (100 * sum) / n,
        setting: [t.effort && t.effort !== 'vla' ? t.effort : undefined, t.mode].filter(Boolean).join('; ') || undefined,
        cost: costs ? cost / costs : undefined,
        tokens: outs === n ? Math.round(out / n) : undefined,
        metrics: mins ? { latency: Math.round((60 * min) / mins) } : undefined,
      });
    }
    return rows;
  },
};
export default board;
