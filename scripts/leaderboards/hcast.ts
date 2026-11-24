// HCAST (Human-Calibrated Autonomy Software Tasks, METR).
// Reads METR's public Time Horizon 1.1 run-level dataset (runs.jsonl) and filters to task_source "HCAST"
// (157 tasks across 69 task families, excluding human baselines). The headline score is each model's
// unweighted mean task success rate (%) across all evaluated HCAST tasks, where each task's success rate
// averages binary task completion across runs. Parts split success rate by estimated human completion time
// (the four difficulty buckets from Figure 6 of the HCAST paper). Stats keep family-weighted success rate,
// mean continuous score, mean total tokens per run, mean wall time, evaluated task count and run count.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { METR_ALIASES } from './metr-time-horizon.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/METR/eval-analysis-public/main/reports/time-horizon-1-1/data/raw/runs.jsonl';

interface Run {
  task_id: string;
  task_family: string;
  alias?: string;
  model?: string;
  score_cont?: number | null;
  score_binarized?: number | null;
  human_minutes?: number | null;
  task_source?: string;
  generation_cost?: number | null;
  tokens_count?: number | null;
  started_at?: number | null;
  completed_at?: number | null;
  scaffold?: string | null;
}

function bucketOf(minutes: number): 'under15m' | 'min15To1h' | 'hour1To4h' | 'over4h' {
  if (minutes < 15) return 'under15m';
  if (minutes < 60) return 'min15To1h';
  if (minutes < 240) return 'hour1To4h';
  return 'over4h';
}

const board: Leaderboard = {
  benchmark: 'hcast',
  url: 'https://metr.org/time-horizons/',
  feed: FEED,
  terms: 'METR publishes the Time Horizon 1.1 run logs under the MIT license in METR/eval-analysis-public. https://github.com/METR/eval-analysis-public',
  headline: 'METR publishes run-level HCAST outcomes in Time Horizon 1.1, so this is the unweighted mean task success rate across evaluated HCAST tasks.',
  aliases: {
    ...METR_ALIASES,
    'GPT-4 1106': 'gpt-4-turbo-nov-2023',
    'Claude 4 Opus': 'claude-opus-4',
    'Claude 4.1 Opus': 'claude-opus-4-1',
  },
  parts: {
    under15m: { name: 'Under 15 minutes', group: 'Human duration' },
    min15To1h: { name: '15 minutes to 1 hour', group: 'Human duration' },
    hour1To4h: { name: '1 to 4 hours', group: 'Human duration' },
    over4h: { name: 'Over 4 hours', group: 'Human duration' },
  },
  stats: {
    familyWeighted: { name: 'Family-weighted success rate', unit: '%', better: 'higher', note: 'Task success rate weighted by the inverse square root of tasks in each family.' },
    continuousScore: { name: 'Mean continuous score', unit: '%', better: 'higher' },
    totalTokens: { name: 'Mean total tokens per run', unit: 'tokens', better: 'lower' },
    wallMinutes: { name: 'Mean run time', unit: 'minutes', better: 'lower' },
    tasks: { name: 'Evaluated tasks', unit: 'count' },
    runs: { name: 'Total runs', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const raw = await fetchText(FEED, {}, 3, 120_000);
    const byModel = new Map<string, Run[]>();
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      const r = JSON.parse(line) as Run;
      if (r.task_source !== 'HCAST') continue;
      const name = (r.alias || r.model || '').trim();
      if (!name || /^human$/i.test(name)) continue;
      const list = byModel.get(name);
      if (list) list.push(r);
      else byModel.set(name, [r]);
    }
    if (!byModel.size) throw new Error('No HCAST runs found in METR Time Horizon 1.1 runs.jsonl');

    const rows: LeaderboardRow[] = [];
    for (const [rawName, runs] of byModel) {
      const byTask = new Map<string, { family: string; minutes: number | null; bin: number[]; cont: number[] }>();
      const scaffolds = new Map<string, number>();
      const costs: number[] = [];
      const tokens: number[] = [];
      const wallMins: number[] = [];

      for (const r of runs) {
        if (typeof r.score_binarized !== 'number' || !Number.isFinite(r.score_binarized)) continue;
        let t = byTask.get(r.task_id);
        if (!t) {
          t = { family: r.task_family, minutes: typeof r.human_minutes === 'number' ? r.human_minutes : null, bin: [], cont: [] };
          byTask.set(r.task_id, t);
        }
        t.bin.push(r.score_binarized);
        if (typeof r.score_cont === 'number' && Number.isFinite(r.score_cont)) t.cont.push(r.score_cont);
        if (r.scaffold) scaffolds.set(r.scaffold, (scaffolds.get(r.scaffold) ?? 0) + 1);
        if (typeof r.generation_cost === 'number' && Number.isFinite(r.generation_cost) && r.generation_cost > 0) costs.push(r.generation_cost);
        if (typeof r.tokens_count === 'number' && Number.isFinite(r.tokens_count) && r.tokens_count > 0) tokens.push(r.tokens_count);
        if (typeof r.started_at === 'number' && typeof r.completed_at === 'number' && r.completed_at > r.started_at) {
          const mins = (r.completed_at - r.started_at) / 60_000;
          if (mins > 0 && mins <= 1440) wallMins.push(mins);
        }
      }
      if (byTask.size < 100) continue;

      const familyCounts = new Map<string, number>();
      for (const t of byTask.values()) familyCounts.set(t.family, (familyCounts.get(t.family) ?? 0) + 1);

      let sumBin = 0;
      let sumCont = 0;
      let nCont = 0;
      let sumW = 0;
      let sumWBin = 0;
      const buckets: Record<'under15m' | 'min15To1h' | 'hour1To4h' | 'over4h', number[]> = {
        under15m: [], min15To1h: [], hour1To4h: [], over4h: [],
      };

      for (const t of byTask.values()) {
        const taskBin = t.bin.reduce((a, b) => a + b, 0) / t.bin.length;
        sumBin += taskBin;
        if (t.cont.length) {
          sumCont += t.cont.reduce((a, b) => a + b, 0) / t.cont.length;
          nCont++;
        }
        const w = 1 / Math.sqrt(familyCounts.get(t.family) ?? 1);
        sumW += w;
        sumWBin += w * taskBin;
        if (t.minutes !== null) buckets[bucketOf(t.minutes)].push(taskBin);
      }

      const inspect = /\(Inspect\)$/i.test(rawName);
      const model = rawName.replace(/\s*\(Inspect\)$/i, '').trim();
      const topScaffold = [...scaffolds.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const harness = topScaffold && topScaffold !== 'null' ? topScaffold.split(',').at(-1)!.trim() : undefined;

      const metrics: Record<string, number> = {
        familyWeighted: (sumWBin / sumW) * 100,
        tasks: byTask.size,
        runs: runs.length,
      };
      if (nCont) metrics.continuousScore = (sumCont / nCont) * 100;
      for (const [bk, vals] of Object.entries(buckets)) {
        if (vals.length) metrics[bk] = (vals.reduce((a, b) => a + b, 0) / vals.length) * 100;
      }
      if (tokens.length) metrics.totalTokens = Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length);
      if (wallMins.length) metrics.wallMinutes = wallMins.reduce((a, b) => a + b, 0) / wallMins.length;

      rows.push({
        model,
        setting: inspect ? 'Inspect' : undefined,
        harness,
        score: (sumBin / byTask.size) * 100,
        trials: Math.round(runs.length / byTask.size),
        ...(costs.length >= byTask.size ? { cost: costs.reduce((a, b) => a + b, 0) / costs.length } : {}),
        metrics,
      });
    }
    return checked(rows, 18);
  },
};

export default board;
