// Conceptual Reasoning Index. conceptualreasoning.ai renders data/cri-scores.csv in the browser (data.js):
// per model the three sub-indices LMCA, ACCoRD (concord) and DTBench, each 0 to 100. The page computes
// the overall CRI as 0.6 × LMCA + 0.2 × ACCoRD + 0.2 × DTBench, only for models with all three, and ranks
// by it; the importer computes it the same way (the CSV's own cri column is mostly blank and unused by the
// page). Effort variants (rows whose name differs from base_model, such as "Claude Opus 5 (low)") appear
// only on the charts and are skipped; a canonical row's effort becomes the setting. The page leaves Reka
// out of the leaderboard, and so does the importer. lmca_cost and dt_cost are per-item costs of the
// sub-benchmarks, not of one index task, so no cost is kept. cri_ci, the 95% half-width the page prints as
// "±" after the overall, gives metrics.ciLow and metrics.ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://conceptualreasoning.ai/data/cri-scores.csv';

const board: Leaderboard = {
  benchmark: 'conceptual-reasoning-index',
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
      if (r.base_model && r.model !== r.base_model) continue;
      const [lmca, concord, dt] = [n(r.lmca), n(r.concord), n(r.dtbench)];
      if (lmca == null || concord == null || dt == null) continue;
      const score = 0.6 * lmca + 0.2 * concord + 0.2 * dt;
      const half = n(r.cri_ci);
      rows.push({
        model: r.model.trim(),
        score,
        metrics: half ? { ciLow: score - half, ciHigh: score + half } : undefined,
        setting: r.effort || (/^DeepSeek Chat V3\.1$/.test(r.model.trim()) ? 'non-thinking' : undefined),
        date: /^\d{4}-\d\d-\d\d$/.test(r.release_date ?? '') ? r.release_date : undefined,
      });
    }
    return rows;
  },
};
export default board;
