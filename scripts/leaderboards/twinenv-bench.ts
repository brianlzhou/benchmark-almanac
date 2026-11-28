// TwinEnv-Bench (TraceLite AI): counterfactual environment adaptation leaderboard across 117 paired tasks and 5 OS layers.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://tracelite.ai/twinenv-leaderboard.html';

interface TwinEnvRecord {
  model: string;
  provider?: string;
  scope: string;
  accounting: string;
  target1: number;
  base1: number;
  shift_drop: number;
  exposed1: number;
  latent1: number;
  pass_at_3: number;
  pass_hat_3: number;
  probe_pct: number;
  cmds: number;
  tokens_k: number;
  time_s: number;
  cost: number;
}

const LAYER_KEYS: Record<string, string> = {
  'E1 System (12)': 'e1System',
  'E2 Software Stack (24)': 'e2SoftwareStack',
  'E3 Execution Context (43)': 'e3ExecutionContext',
  'E4 Boundary (36)': 'e4Boundary',
  'E5 State (2)': 'e5State',
};

const board: Leaderboard = {
  benchmark: 'twinenv-bench',
  url: PAGE,
  feed: PAGE,
  costPer: 'task',
  terms: 'Public leaderboard data published by TraceLite AI on tracelite.ai.',
  parts: {
    exposed1: { name: 'Interactive exposed pass@1', group: 'Shift type' },
    latent1: { name: 'Deployment latent pass@1', group: 'Shift type' },
    e1System: { name: 'E1 System', group: 'OS layer' },
    e2SoftwareStack: { name: 'E2 Software stack', group: 'OS layer' },
    e3ExecutionContext: { name: 'E3 Execution context', group: 'OS layer' },
    e4Boundary: { name: 'E4 Boundary', group: 'OS layer' },
    e5State: { name: 'E5 State', group: 'OS layer' },
  },
  stats: {
    base1: {
      name: 'Baseline pass@1',
      unit: '%',
      better: 'higher',
      note: 'Baseline pass@1 inside standard permissive containers.',
    },
    shiftDrop: {
      name: 'Shift delta',
      unit: '%',
      better: 'higher',
      note: 'Change in percentage points from baseline pass@1 to shifted target pass@1 (less negative is better).',
    },
    passAt3: {
      name: 'pass@3',
      unit: '%',
      better: 'higher',
      note: 'Probability of solving a target task in at least one of three attempts.',
    },
    passHat3: {
      name: 'pass^3',
      unit: '%',
      better: 'higher',
      note: 'Probability of solving a target task consistently across all three attempts.',
    },
    probePct: {
      name: 'Environment probe rate',
      unit: '%',
      note: 'Share of runs where the agent actively probed the environment before acting.',
    },
    cmds: {
      name: 'Shell commands per run',
      unit: 'count',
      better: 'lower',
      note: 'Mean shell commands executed per target run.',
    },
    totalTokens: {
      name: 'Total tokens per run',
      unit: 'tokens',
      better: 'lower',
      note: 'Mean total tokens consumed per executed target run.',
    },
    latency: {
      name: 'Wall time per run',
      unit: 'seconds',
      better: 'lower',
      note: 'Mean wall time in seconds per executed target run.',
    },
  },
  chart: {
    title: 'Cost and reliability Pareto frontier',
    x: {
      key: 'cost',
      label: 'Cost per target run',
      unit: '$',
      better: 'lower',
      log: true,
    },
    y: {
      key: 'passHat3',
      label: 'Strict pass^3 reliability',
      unit: '%',
      better: 'higher',
    },
    note: 'Strict pass^3 reliability against mean USD cost per executed target run, matching the TraceLite cost Pareto figure.',
  },

  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const jsonMatch = html.match(/<script[^>]*id="leaderboardData"[^>]*>([\s\S]*?)<\/script>/i);
    if (!jsonMatch) throw new Error('Missing #leaderboardData JSON in TwinEnv-Bench leaderboard');

    const records = JSON.parse(jsonMatch[1]) as TwinEnvRecord[];
    if (!Array.isArray(records) || records.length < 9) {
      throw new Error(`Expected TwinEnv-Bench records, got ${records.length}`);
    }

    const byKey = new Map<string, TwinEnvRecord[]>();
    for (const r of records) {
      const key = `${r.accounting}::${r.model}`;
      const list = byKey.get(key) ?? [];
      list.push(r);
      byKey.set(key, list);
    }

    const rows: LeaderboardRow[] = [];
    for (const group of byKey.values()) {
      const main = group.find((r) => r.scope === 'All 117 tasks');
      if (!main || !Number.isFinite(main.target1)) continue;

      const metrics: Record<string, number> = {
        exposed1: main.exposed1,
        latent1: main.latent1,
        base1: main.base1,
        shiftDrop: main.shift_drop,
        passAt3: main.pass_at_3,
        passHat3: main.pass_hat_3,
        probePct: main.probe_pct,
        cmds: main.cmds,
        totalTokens: Math.round(main.tokens_k * 1000),
        latency: main.time_s,
      };
      for (const layerRec of group) {
        const lk = LAYER_KEYS[layerRec.scope];
        if (lk && Number.isFinite(layerRec.target1)) {
          metrics[lk] = layerRec.target1;
        }
      }

      rows.push({
        model: main.model.trim(),
        setting: main.accounting === 'refusal_zero' ? 'Refusal as zero' : undefined,
        score: main.target1,
        trials: 3,
        cost: Number.isFinite(main.cost) ? main.cost : undefined,
        metrics,
      });
    }

    if (rows.length < 9) {
      throw new Error(`Expected TwinEnv-Bench rows, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
