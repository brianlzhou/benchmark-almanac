// RewardBench 2 (Ai2). The allenai/reward-bench Space builds its leaderboard from the eval-set/ folder of the
// allenai/reward-bench-2-results dataset: one small JSON per model with six domain accuracies (Factuality,
// Precise IF, Math, Safety, Focus, Ties, 0 to 1) and the model type. The Space scores each model as the
// unweighted mean of the domains it has (np.ma.average with equal weights, missing ones masked) and skips
// allenai/open_instruct_dev* checkpoints and google/*-preview-* files; the importer does the same (0 to
// 100). The files are listed through the Hub API and fetched a few at a time.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const REPO = 'allenai/reward-bench-2-results';
const LIST = `https://huggingface.co/api/datasets/${REPO}`;
const FILE = (path: string) => `https://huggingface.co/datasets/${REPO}/resolve/main/${path}`;
const DOMAINS = ['Factuality', 'Precise IF', 'Math', 'Safety', 'Focus', 'Ties'] as const;

type Result = Partial<Record<(typeof DOMAINS)[number], number | null>> & { model?: string; model_type?: string };

const board: Leaderboard = {
  benchmark: 'rewardbench-2',
  url: 'https://huggingface.co/spaces/allenai/reward-bench',
  feed: `${LIST} (eval-set/*.json, mean of six domains)`,
  terms: 'Hugging Face dataset allenai/reward-bench-2-results, which carries no licence tag, read as the Apache-2.0 leaderboard Space reads it.',
  aliases: {},
  async fetch() {
    const { siblings } = await fetchJson<{ siblings: { rfilename: string }[] }>(LIST);
    const paths = siblings
      .map((s) => s.rfilename)
      .filter((p) => p.startsWith('eval-set/') && p.endsWith('.json'))
      .filter((p) => !p.startsWith('eval-set/allenai/open_instruct_dev') && !/^eval-set\/google\/.*-preview-/.test(p));
    const rows: LeaderboardRow[] = [];
    for (let i = 0; i < paths.length; i += 8) {
      const batch = await Promise.all(paths.slice(i, i + 8).map((p) => fetchJson<Result>(FILE(p)).catch(() => null)));
      for (const r of batch) {
        if (!r?.model) continue;
        const values = DOMAINS.map((d) => r[d]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        if (!values.length) continue;
        rows.push({ model: r.model, score: (100 * values.reduce((a, b) => a + b, 0)) / values.length });
      }
    }
    if (!rows.length) throw new Error('no RewardBench 2 results read');
    return rows;
  },
};
export default board;
