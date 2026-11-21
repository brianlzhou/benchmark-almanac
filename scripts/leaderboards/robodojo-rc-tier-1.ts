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
// trial reports them. Keep the trial count, task scores and token categories with complete coverage.
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
  usage?: Record<string, number> | null;
  task?: string;
  date?: string;
  calls?: number;
  tokens?: number;
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
    type Scored = Trial & {score: number};
    const groups = new Map<string, Scored[]>();
    for (const t of data.runs) {
      if (t.benchmark !== BENCHMARK || !t.leaderboard?.some(x => x === 'capability' || x === 'pareto') || typeof t.score !== 'number') continue;
      const key = [t.model, t.effort ?? '', t.mode ?? ''].join('|');
      const group = groups.get(key) ?? [];
      group.push({...t, score: t.score});
      groups.set(key, group);
    }
    const rows: LeaderboardRow[] = [];
    const parts: NonNullable<Leaderboard['parts']> = {};
    for (const group of groups.values()) {
      const t = group[0];
      const mean = (get: (t: Scored) => unknown, complete = false) => {
        const values = group.map(get).filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
        if (!values.length || (complete && values.length !== group.length)) return undefined;
        return values.reduce((a, b) => a + b, 0) / values.length;
      };
      const minutes = mean(r => r.minutes), output = mean(r => r.usage?.output, true);
      const metrics: Record<string, number> = {};
      if (minutes !== undefined) metrics.latency = Math.round(60 * minutes);
      for (const [key, value] of Object.entries({
        inputTokens: mean(r => r.usage?.input, true), cachedTokens: mean(r => r.usage?.cached_input ?? r.usage?.cache_read, true),
        cacheWriteTokens: mean(r => r.usage?.cache_write, true), reasoningTokens: mean(r => r.usage?.thinking, true),
        totalTokens: mean(r => r.usage?.total ?? r.tokens, true), calls: mean(r => r.calls, true),
      })) if (value !== undefined) metrics[key] = value;
      for (const name of new Set(group.map(r => r.task))) {
        if (!name) continue;
        const key = name.toLowerCase().replace(/ (.)/g, (_, c: string) => c.toUpperCase());
        const subset = group.filter(r => r.task === name);
        metrics[key] = 100 * subset.reduce((sum, r) => sum + r.score, 0) / subset.length;
        parts[key] = {name, group: 'Task'};
      }
      const dates = new Set(group.map(r => r.date?.slice(0, 10)));
      rows.push({
        model: data.models?.[t.model] ?? t.model,
        score: 100 * group.reduce((sum, r) => sum + r.score, 0) / group.length,
        setting: [t.effort && t.effort !== 'vla' ? t.effort : undefined, t.mode].filter(Boolean).join('; ') || undefined,
        cost: mean(r => r.cost), tokens: output === undefined ? undefined : Math.round(output),
        trials: group.length, date: dates.size === 1 ? t.date?.slice(0, 10) : undefined, metrics,
      });
    }
    board.parts = parts;
    return rows;
  },
};
export default board;
