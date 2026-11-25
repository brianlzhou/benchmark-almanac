// Dual-Arm Sim (micro1). A static micro1 report page (see realmpathology.ts, micro1Data): the page's
// leaderboard card is an inline data literal, window.benchmarks_data["dual-arm-sim"], read as data. Its default tab,
// Progress score (0 to 100), is the score. Per-task progress scores, completion rate, trial counts, latency,
// output tokens, thinking tokens, and total evaluation cost come from the page's embedded all-tasks D.models JSON.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Data } from './realmpathology.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const PAGE = 'https://www.micro1.ai/benchmark/dual-arm-sim';

interface TaskStats { n: number; stages: number[]; success: number }
interface DualArmModel {
  name: string;
  vla?: boolean;
  by_task: {
    all: TaskStats;
    instrument_swap?: TaskStats;
    cartridge_swap?: TaskStats;
    sample_transfer?: TaskStats;
    parts_kitting?: TaskStats;
  };
  latency?: number;
  cost?: number;
  outtok?: number;
  think?: number;
}

const progressPct = (t: TaskStats | undefined) =>
  t && t.n > 0 ? Number(((t.stages.reduce((acc, c, i) => acc + c * i, 0) / (t.n * 5)) * 100).toFixed(1)) : undefined;

const board: Leaderboard = {
  benchmark: 'dual-arm-sim',
  parts: {
    instrumentSwap: { name: 'Instrument swap', group: 'Task' },
    cartridgeSwap: { name: 'Cartridge swap', group: 'Task' },
    sampleTransfer: { name: 'Sample transfer', group: 'Task' },
    partsKitting: { name: 'Parts kitting', group: 'Task' },
  },
  stats: {
    successRate: { name: 'Task completion rate', unit: '%', better: 'higher' },
    totalCostUsd: { name: 'Total evaluation cost', unit: 'usd', better: 'lower' },
    decisionLatency: { name: 'Mean decision latency', unit: 'seconds', better: 'lower' },
    outputTokensPerDecision: { name: 'Output tokens per decision', unit: 'tokens' },
    thinkingTokensPerDecision: { name: 'Thinking tokens per decision', unit: 'tokens' },
  },
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "dual-arm-sim", Progress score, and embedded D.models JSON)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  async fetch() {
    const [rows, html] = await Promise.all([micro1Data(PAGE, 'dual-arm-sim'), fetchText(PAGE)]);
    const dm = /\bD\s*=\s*\{"models":/.exec(html);
    const byName = new Map<string, DualArmModel>();
    if (dm) {
      const data = jsonAt<{ models: DualArmModel[] }>(html, dm.index + dm[0].indexOf('{'));
      for (const m of data.models) if (!m.vla && m.name) byName.set(m.name.trim(), m);
    }
    const out: LeaderboardRow[] = rows.map((row) => {
      const m = byName.get(row.model);
      const metrics: Record<string, number> = {};
      let trials: number | undefined;
      let cost: number | undefined;
      if (m) {
        const taskMap = [
          ['instrumentSwap', m.by_task.instrument_swap],
          ['cartridgeSwap', m.by_task.cartridge_swap],
          ['sampleTransfer', m.by_task.sample_transfer],
          ['partsKitting', m.by_task.parts_kitting],
        ] as const;
        for (const [k, t] of taskMap) {
          const p = progressPct(t);
          if (p !== undefined) metrics[k] = p;
        }
        if (m.by_task.all.n > 0) {
          trials = m.by_task.all.n;
          metrics.successRate = Number(((m.by_task.all.success / m.by_task.all.n) * 100).toFixed(1));
        }
        if (typeof m.cost === 'number' && Number.isFinite(m.cost)) {
          metrics.totalCostUsd = m.cost;
          if (trials) cost = Number((m.cost / trials).toFixed(2));
        }
        if (typeof m.latency === 'number' && Number.isFinite(m.latency)) metrics.decisionLatency = m.latency;
        if (typeof m.outtok === 'number' && Number.isFinite(m.outtok)) metrics.outputTokensPerDecision = m.outtok;
        if (typeof m.think === 'number' && Number.isFinite(m.think)) metrics.thinkingTokensPerDecision = m.think;
      }
      return {
        ...row,
        setting: 'All four tasks',
        ...(trials ? { trials } : {}),
        ...(cost !== undefined ? { cost } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      };
    });
    return out;
  },
};
export default board;
