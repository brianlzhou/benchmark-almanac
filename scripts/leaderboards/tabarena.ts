// TabArena (AutoGluon, University of Freiburg, and AWS): living benchmark for tabular ML and
// tabular foundation models. Reads the Space's official overall website_leaderboard.csv
// (no imputation, all splits, all tasks, all datasets), extracting Elo with 95% CI (+hi/-lo),
// normalized score, mean rank, harmonic rank, improvability, median train/predict times,
// verification badge, license, submitter organization, and reference link.
import { fetchText, parseCsv } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED =
  'https://huggingface.co/spaces/TabArena/leaderboard/raw/main/data/entrants_api/imputation_no/splits_all/tasks_all/datasets_all/website_leaderboard.csv';

const num = (v: string | undefined): number | undefined => {
  if (!v) return undefined;
  const n = Number(v.trim());
  return Number.isFinite(n) ? n : undefined;
};

const board: Leaderboard = {
  benchmark: 'tabarena',
  url: 'https://huggingface.co/spaces/TabArena/leaderboard',
  feed: FEED,
  terms: 'Public Apache-2.0 benchmark leaderboard Space published by the TabArena authors.',
  verified: 'verified by the TabArena team',
  chart: {
    title: 'Elo versus inference time',
    x: { key: 'predictSeconds', label: 'Median predict time (s per 1,000 samples)', unit: 's', better: 'lower', log: true },
    y: { key: 'score', label: 'TabArena Elo', unit: 'elo', better: 'higher' },
    note: 'Matches the inference-time Pareto explorer on the TabArena leaderboard across all datasets.',
  },
  stats: {
    normalizedScore: { name: 'Normalized score', unit: 'score', better: 'higher', note: 'Normalized performance score across datasets on a 0 to 1 scale.' },
    meanRank: { name: 'Mean rank', unit: 'score', better: 'lower', note: 'Average rank across TabArena datasets.' },
    harmonicRank: { name: 'Harmonic mean rank', unit: 'score', better: 'lower', note: 'Harmonic mean rank across TabArena datasets.' },
    improvability: { name: 'Improvability', unit: '%', better: 'lower', note: 'Average relative error reduction available by switching to the best model per dataset.' },
    trainSeconds: { name: 'Median train time', unit: 'seconds', better: 'lower', note: 'Median training time in seconds per 1,000 samples.' },
    predictSeconds: { name: 'Median predict time', unit: 'seconds', better: 'lower', note: 'Median inference time in seconds per 1,000 samples.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const csv = await fetchText(FEED);
    const records = parseCsv(csv);
    const rows: LeaderboardRow[] = [];
    for (const r of records) {
      const rawModel = (r['Model'] ?? '').trim();
      if (!rawModel) continue;
      let label = rawModel;
      let link: string | undefined;
      const md = rawModel.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (md) {
        label = md[1].trim();
        link = md[2].trim().replace(/&amp;/g, '&');
      }
      let model = label;
      let setting: string | undefined;
      const paren = label.match(/^(.+?)\s+\((default|tuned|tuned \+ ensembled|full|medium)\)$/);
      if (paren) {
        model = paren[1].trim();
        setting = paren[2].trim();
      }
      const score = num(r['Elo [⬆️]']);
      if (score === undefined) continue;
      let low: number | undefined;
      let high: number | undefined;
      const ci = (r['Elo 95% CI'] ?? '').trim().match(/^\+(\d+(?:\.\d+)?)\/-(\d+(?:\.\d+)?)$/);
      if (ci) {
        high = +(score + Number(ci[1])).toFixed(1);
        low = +(score - Number(ci[2])).toFixed(1);
      }
      const metrics: Record<string, number> = {};
      const ns = num(r['Score [⬆️]']);
      if (ns !== undefined) metrics.normalizedScore = ns;
      const mr = num(r['Rank [⬇️]']);
      if (mr !== undefined) metrics.meanRank = mr;
      const hr = num(r['Harmonic Rank [⬇️]']);
      if (hr !== undefined) metrics.harmonicRank = hr;
      const imp = num(r['Improvability (%) [⬇️]']);
      if (imp !== undefined) metrics.improvability = imp;
      const tr = num(r['Median Train Time (s/1K) [⬇️]']);
      if (tr !== undefined) metrics.trainSeconds = tr;
      const pr = num(r['Median Predict Time (s/1K) [⬇️]']);
      if (pr !== undefined) metrics.predictSeconds = pr;

      const submitter = (r['Organization'] ?? '').trim() || undefined;
      const license = (r['License'] ?? '').trim() || undefined;
      const verified = (r['Verified'] ?? '').trim() === '✔️' ? true : undefined;

      rows.push({
        model,
        score,
        ...(setting ? { setting } : {}),
        ...(low !== undefined && high !== undefined ? { low, high } : {}),
        ...(verified !== undefined ? { verified } : {}),
        ...(license ? { license } : {}),
        ...(submitter ? { submitter } : {}),
        ...(link && /^https?:\/\/\S+$/.test(link) ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
