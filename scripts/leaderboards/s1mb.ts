// S1MB (System One Mosaic Benchmark, hotchpotch): evaluates System One decision models across
// English v1 (137 typed tasks), Japanese v1 (27 tasks), and Vision v1 (26 tasks) unified into
// choice, yes-no judgment, and numeric scoring formats. Reads the published viewer-summary.json
// from Hugging Face dataset hotchpotch/s1mb-result. Headline score is the mean baseline-adjusted
// skill score across complete English v1 runs (scaled to 100), with Japanese v1 and Vision v1 parts.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://huggingface.co/datasets/hotchpotch/s1mb-result/resolve/main/viewer-summary.json';

interface S1mbSummary {
  payload: {
    benchmarks: { id: string }[];
    categories: { id: string; benchmarks: string[] }[];
    models: { run_id: string; model: { id: string; adapter?: string } }[];
    results: {
      model: number;
      benchmark: number;
      scoring?: { eligible?: boolean };
      metrics?: { baseline_adjusted_score?: number; accuracy?: number };
    }[];
  };
}

const mean100 = (vals: number[]): number => +(vals.reduce((a, b) => a + b, 0) / vals.length * 100).toFixed(2);

const board: Leaderboard = {
  benchmark: 's1mb',
  url: 'https://huggingface.co/spaces/hotchpotch/S1MB-leaderboard',
  feed: FEED,
  terms: 'Public Hugging Face dataset and leaderboard published by hotchpotch.',
  headline: 'Mean baseline-adjusted skill score (0 to 100) across all 137 English v1 tasks for models with complete English v1 coverage.',
  parts: {
    japaneseV1: { name: 'Japanese v1', unit: 'score', better: 'higher' },
  },
  stats: {
    englishRawAcc: { name: 'English v1 mean accuracy', unit: '%', better: 'higher', note: 'Unweighted mean raw accuracy across completed English v1 tasks.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const summary = JSON.parse(await fetchText(FEED)) as S1mbSummary;
    const p = summary.payload;
    const catSet = (id: string) => new Set(p.categories.find((c) => c.id === id)?.benchmarks ?? []);
    const engSet = catSet('english-v1');
    const jaSet = catSet('japanese-v1');
    const visSet = catSet('vision-v1');
    const bmIds = p.benchmarks.map((b) => b.id);

    const acc = new Map<number, { eng: number[]; engAcc: number[]; ja: number[]; vis: number[] }>();
    for (const r of p.results ?? []) {
      if (!r.scoring?.eligible) continue;
      const bid = bmIds[r.benchmark];
      const v = r.metrics?.baseline_adjusted_score;
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      let bucket = acc.get(r.model);
      if (!bucket) {
        bucket = { eng: [], engAcc: [], ja: [], vis: [] };
        acc.set(r.model, bucket);
      }
      if (engSet.has(bid)) {
        bucket.eng.push(v);
        if (typeof r.metrics?.accuracy === 'number' && Number.isFinite(r.metrics.accuracy)) {
          bucket.engAcc.push(r.metrics.accuracy);
        }
      }
      if (jaSet.has(bid)) bucket.ja.push(v);
      if (visSet.has(bid)) bucket.vis.push(v);
    }

    const rows: LeaderboardRow[] = [];
    for (const [mi, b] of acc) {
      if (b.eng.length < engSet.size) continue;
      const entry = p.models[mi];
      const modelId = entry?.model?.id?.trim();
      if (!modelId) continue;

      const metrics: Record<string, number> = {};
      if (b.ja.length === jaSet.size && jaSet.size > 0) metrics.japaneseV1 = mean100(b.ja);
      if (b.engAcc.length > 0) metrics.englishRawAcc = mean100(b.engAcc);

      const link = modelId.includes('/') && !modelId.includes('@') && !/\s/.test(modelId)
        ? `https://huggingface.co/${modelId}`
        : undefined;

      rows.push({
        model: modelId,
        score: mean100(b.eng),
        ...(entry.model.adapter ? { setting: entry.model.adapter } : {}),
        ...(link ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
