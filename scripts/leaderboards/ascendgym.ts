// AscendGYM measures agent-assisted AscendC kernel optimization on 21 model and agent entries.
// The headline score is STS Token, the site's speedup-token score, and the other published summaries stay as metrics.
// This importer reads the supplementary JSON bundle loaded by the public dashboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://slai-aitp.github.io/AscendGYM/';
const FEED = 'https://slai-aitp.github.io/AscendGYM/assets/supplement_bundle-DAUAV8gb.js';

const board: Leaderboard = {
  benchmark: 'ascendgym',
  url: PAGE,
  feed: FEED,
  terms: 'The project repository is Apache 2.0 licensed. The dashboard has no robots.txt, and the results are credited to SLAI-AITP.',
  stats: {
    stsBase: { name: 'STS base', unit: 'score', better: 'higher' },
    stsDeduction: { name: 'STS deduction', unit: 'score', better: 'lower' },
    ebgs: { name: 'Geometric mean speedup', unit: 'speedup', better: 'higher' },
    budgetGm: { name: 'Geometric mean speedup at 50M tokens', unit: 'speedup', better: 'higher' },
    fast1: { name: 'FAST1', unit: '%', better: 'higher', note: 'Share of tasks both correct and faster than the baseline.' },
    vlrMean: { name: 'Valid-to-LLM-round ratio', unit: '%', better: 'higher' },
    taskPassRate: { name: 'Task pass rate', unit: '%', better: 'higher' },
    gateRate: { name: 'Correctness gate', unit: '%', better: 'higher' },
    candidatePassRate: { name: 'Candidate pass rate', unit: '%', better: 'higher' },
    speedupMean: { name: 'Mean speedup', unit: 'speedup', better: 'higher' },
    tokensTotalK: { name: 'Cumulative tokens', unit: 'thousands', better: 'lower' },
    tokensMeanK: { name: 'Mean tokens per task', unit: 'thousands', better: 'lower' },
    roundsMedian: { name: 'LLM rounds', unit: 'count', better: 'lower', note: 'Median number of LLM rounds.' },
    wallTimeMedianS: { name: 'Wall time', unit: 'seconds', better: 'lower', note: 'Median wall-clock time.' },
    wallTimeTotalS: { name: 'Total wall time', unit: 'seconds', better: 'lower' },
    bestDurationUs: { name: 'Best latency', unit: 'score', better: 'lower', note: 'Best kernel execution duration in microseconds.' },
  },
  aliases: {
    'gpt-5.6-terra': 'gpt-5-6-terra',
    'glm-5.3': 'glm-5-3',
    'Qwen3.5-122B': 'qwen3-5-122b-a10b',
    'Qwen3.6-35B': 'qwen-3-6-35b-a3b',
    'DeepSeek-V4-Flash-BF16': 'deepseek-v4-flash',
  },
  reference: ['Default'],
  async fetch(): Promise<LeaderboardRow[]> {
    const page = await fetchText(PAGE);
    const bundle = page.match(/assets\/(supplement_bundle[^"'\s]+\.js)/)?.[1];
    const source = await fetchText(bundle ? new URL(`assets/${bundle}`, PAGE).href : FEED);
    const match = source.match(/s=JSON\.parse\('([\s\S]*)'\)/);
    if (!match) throw new Error('AscendGYM supplementary bundle has no entry JSON');
    const entries = JSON.parse(match[1]) as Array<{
      cohort?: string;
      agent?: { id?: string };
      engine_model?: { id?: string };
      overall?: Record<string, unknown>;
    }>;
    const rows: LeaderboardRow[] = [];
    for (const entry of entries) {
      const model = entry.engine_model?.id;
      const score = entry.overall?.sts_token;
      if (!model || typeof score !== 'number' || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      const values: Array<[string, string]> = [
        ['stsBase', 'sts_base'],
        ['stsDeduction', 'sts_deduction'],
        ['ebgs', 'ebgs'],
        ['budgetGm', 'budget_gm'],
        ['fast1', 'fast_1'],
        ['vlrMean', 'vlr_mean'],
        ['taskPassRate', 'task_pass_rate'],
        ['gateRate', 'gate_rate'],
        ['candidatePassRate', 'candidate_pass_rate'],
        ['speedupMean', 'speedup_mean'],
        ['tokensTotalK', 'tokens_total_k'],
        ['tokensMeanK', 'tokens_mean_k'],
        ['roundsMedian', 'rounds_median'],
        ['wallTimeMedianS', 'wall_time_median_s'],
        ['wallTimeTotalS', 'wall_time_total_s'],
        ['bestDurationUs', 'best_duration_us'],
      ];
      for (const [key, field] of values) {
        const value = entry.overall?.[field];
        if (typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
      }
      rows.push({
        model,
        score,
        harness: entry.agent?.id,
        setting: entry.cohort === 'default' ? 'Default' : undefined,
        metrics,
      });
    }
    if (rows.length < 20) throw new Error(`AscendGYM: ${rows.length} entries, expected at least 20`);
    return rows;
  },
};
export default board;
