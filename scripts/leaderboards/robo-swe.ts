// ROBO-SWE (Vahid Haratian, Vahid Ansari, Mohammadhossein Malmir and Alois Knoll): 236 executable Harbor issue-resolution
// tasks mined from 28 robotics repositories. The Hugging Face dataset ships machine-readable results/summary.json with
// mean_resolve_rate (0 to 1 fraction), complete_cycles (trials), effort setting, harness and mean_known_cost_usd per attempt.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://huggingface.co/datasets/vharatian/Robo-SWE';
const FEED = `${PAGE}/raw/main/results/summary.json`;

interface RoboSweEntry {
  setup: string;
  model: string;
  effort: string;
  harness: string;
  complete_cycles: number;
  tasks_per_cycle: number;
  attempts: number;
  resolved: number;
  mean_resolve_rate: number;
  mean_known_cost_usd: number | null;
}

const HARNESS_MAP: Record<string, string> = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
  opencode: 'OpenCode',
};

const round = (x: number, d = 2) => {
  const f = 10 ** d;
  return Math.round(x * f) / f;
};

const board: Leaderboard = {
  benchmark: 'robo-swe',
  url: PAGE,
  feed: FEED,
  terms: 'The authors publish results/summary.json directly inside the public vharatian/Robo-SWE dataset repository on Hugging Face.',
  harnesses: 'system',
  costPer: 'task',
  async fetch() {
    const entries = await fetchJson<RoboSweEntry[]>(FEED);
    if (!Array.isArray(entries) || entries.length < 5) {
      throw new Error(`ROBO-SWE summary.json changed: only ${entries?.length ?? 0} entries`);
    }
    return entries.map((e): LeaderboardRow => {
      if (!e.model || !Number.isFinite(e.mean_resolve_rate)) {
        throw new Error(`ROBO-SWE entry malformed: ${e.setup}`);
      }
      // Prefer the human-readable model label from setup ("Opus 5.5 · Claude Code · Max · medium") or clean slug
      const shortModel = e.model.includes('/') ? e.model.split('/').slice(1).join('/') : e.model;
      const model = shortModel === 'k3.1-pro' ? 'Kimi K3.1 Pro' : shortModel;
      const harness = HARNESS_MAP[e.harness] ?? e.harness;
      const setting = e.effort ? `${e.effort} effort` : undefined;
      return {
        model,
        harness,
        score: round(e.mean_resolve_rate * 100),
        ...(setting ? { setting } : {}),
        ...(Number.isFinite(e.complete_cycles) && e.complete_cycles > 0 ? { trials: e.complete_cycles } : {}),
        ...(e.mean_known_cost_usd != null && Number.isFinite(e.mean_known_cost_usd) && e.mean_known_cost_usd > 0
          ? { cost: round(e.mean_known_cost_usd, 4) }
          : {}),
      };
    });
  },
};

export default board;
