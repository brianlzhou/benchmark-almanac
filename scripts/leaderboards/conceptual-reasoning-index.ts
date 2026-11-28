// Conceptual Reasoning Index. conceptualreasoning.ai renders data/cri-scores.csv in the browser (data.js):
// per model the three sub-indices LMCA, ACCoRD (concord) and DTBench, each 0 to 100. The page computes
// the overall CRI as 0.6 × LMCA + 0.2 × ACCoRD + 0.2 × DTBench, only for models with all three, and ranks
// by it; the importer computes it the same way (the CSV's own cri column is mostly blank and unused by the
// page). Keep complete effort variants, component scores, component costs and the overall 95% interval.
// Reka is outside the published ranking.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://conceptualreasoning.ai/data/cri-scores.csv';

const board: Leaderboard = {
  benchmark: 'conceptual-reasoning-index',
  parts: { lmca: 'LMCA', concord: 'ACCoRD', dtbench: 'DTBench' },
  stats: {
    lmca_cost: { name: 'LMCA cost per response', unit: 'usd', better: 'lower' },
    dt_cost: { name: 'DTBench cost per response', unit: 'usd', better: 'lower' },
    elo: { name: 'Text Arena Elo', unit: 'elo', better: 'higher' },
    concord_norm: { name: 'ACCoRD normalized violation', unit: 'score', better: 'lower', note: 'Normalized linear-margin violation on ACCoRD, where lower means more consistent.' },
    dtbench_accuracy: { name: 'DTBench capability accuracy', unit: 'score', better: 'higher', note: 'Share of DTBench capability questions answered correctly, stored from 0 to 1.' },
    attitude_edt: { name: 'EDT preference share', unit: 'score', note: 'Share of Newcomb-like attitude questions preferring evidential over causal decision theory, stored from 0 to 1.' },
    lmca_mean: { name: 'LMCA raw critique mean', unit: 'score', note: 'Mean of raw per-critique LMCA scores used for routed-mix cost calculations.' },
  },
  chart: {
    title: 'LMCA performance vs. cost',
    x: { key: 'lmca_cost', label: 'Average LMCA cost per response', unit: '$', better: 'lower', log: true },
    y: { key: 'lmca', label: 'LMCA score', better: 'higher' },
    note: 'Conceptual Reasoning Index plots LMCA score against average cost per response on a log scale with its Pareto frontier.',
  },
  url: 'https://conceptualreasoning.ai/',
  feed: `${FEED} (0.6 LMCA + 0.2 ACCoRD + 0.2 DTBench, as the page computes)`,
  terms: 'Static CSV the conceptualreasoning.ai page loads; robots.txt allows all paths and the site states no terms or license.',
  aliases: {
    Hy3: 'tencent-hy3',
    'Qwen3.5-Plus': 'qwen-3-5-plus-hosted-397b-a17b',
    'Qwen3.5-Flash': 'qwen-3-5-flash-hosted-35b-a3b',
    'Qwen3 30B-A3B Thinking (2507)': 'qwen3-30b-a3b-thinking-jul-2025',
    'Qwen3 30B-A3B Instruct (2507)': 'qwen3-30b-a3b-instruct-jul-2025',
    'Qwen3-Next 80B-A3B Instruct': 'qwen3-next-80b-a3b',
    'Command A': 'cohere-command-a',
    "Command R+ (Aug '24)": 'command-r-plus',
    "Command R (Aug '24)": 'c4ai-command-r-08-2024',
    'DeepSeek Chat V3 (0324)': 'deepseek-v3-mar-2025',
    // DeepSeek's chat endpoint: V3.1 in non-thinking mode (the setting is added below)
    'DeepSeek Chat V3.1': 'deepseek-v3-1',
    "Mistral Small (Mar '26)": 'mistral-small-4',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    const n = (s: string | undefined) => (s && s.trim() !== '' && Number.isFinite(Number(s)) ? Number(s) : null);
    for (const r of parseCsv(await fetchText(FEED))) {
      if (!r.model || r.company === 'Reka') continue;
      const [lmca, concord, dt] = [n(r.lmca), n(r.concord), n(r.dtbench)];
      if (lmca == null || concord == null || dt == null) continue;
      const score = 0.6 * lmca + 0.2 * concord + 0.2 * dt;
      const half = n(r.cri_ci);
      const metrics: Record<string, number> = { lmca, concord, dtbench: dt };
      for (const key of ['lmca_ci', 'concord_ci', 'dtbench_ci', 'lmca_cost', 'dt_cost', 'elo',
        'concord_norm', 'dtbench_accuracy', 'attitude_edt', 'lmca_mean', 'lmca_variance']) {
        const value = n(r[key]);
        if (value !== null) metrics[key] = value;
      }
      if (half !== null) Object.assign(metrics, { ciLow: score - half, ciHigh: score + half });
      rows.push({
        model: (r.base_model || r.model).trim(),
        score,
        metrics, low: metrics.ciLow, high: metrics.ciHigh,
        setting: r.effort || (/^DeepSeek Chat V3\.1$/.test(r.model.trim()) ? 'non-thinking' : undefined),
        date: /^\d{4}-\d\d-\d\d$/.test(r.release_date ?? '') ? r.release_date : undefined,
      });
    }
    return rows;
  },
};
export default board;
