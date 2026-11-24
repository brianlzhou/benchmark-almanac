// OpenNLI Leaderboard (dleemiller): evaluates NLI and decision models across 44 entailment,
// logical reasoning, grounding, and domain test sets. Reads the Space's live data/board.json.
// Per index.html applyScore(), the headline metric is the Brier-calibrated Skill Index scaled by 100
// (skill.overall * 100, where 0 is uniform guessing and 100 is perfect), while the 4 categories stay
// accuracy (%). Also captures category-mean accuracy, 44-dataset mean accuracy, GPU throughput
// (pairs/s), Expected Calibration Error, parameter count, and the live Speed vs Skill Pareto chart.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://huggingface.co/spaces/dleemiller/open-nli-leaderboard/raw/main/data/board.json';

interface OpenNliModel {
  id: string;
  name?: string;
  org?: string;
  params?: number;
  throughput?: number;
  throughput_long?: number;
  overall?: number;
  dataset_mean?: number;
  cats?: Record<string, number>;
  skill?: { overall?: number };
  acc_skill?: { overall?: number };
  auroc?: { overall?: number };
  calibration?: { ece?: number; ece_raw?: number };
}

interface OpenNliBoard {
  models: OpenNliModel[];
}

const pct = (v: number | undefined): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? +(v * 100).toFixed(2) : undefined;

const board: Leaderboard = {
  benchmark: 'open-nli-leaderboard',
  url: 'https://huggingface.co/spaces/dleemiller/open-nli-leaderboard',
  feed: FEED,
  terms: 'Public Hugging Face Space leaderboard published by dleemiller.',
  chart: {
    title: 'Skill Index versus throughput',
    x: { key: 'throughput', label: 'Throughput (pairs/s)', unit: 'pairs/s', better: 'higher', log: true },
    y: { key: 'score', label: 'Skill Index', unit: 'index', better: 'higher' },
    note: 'Matches the speed versus Skill Index Pareto chart on the OpenNLI leaderboard.',
  },
  parts: {
    nli: { name: 'NLI', unit: '%', better: 'higher' },
    reasoning: { name: 'Reasoning', unit: '%', better: 'higher' },
    grounding: { name: 'Grounding', unit: '%', better: 'higher' },
    domain: { name: 'Domain', unit: '%', better: 'higher' },
  },
  stats: {
    categoryMeanAcc: { name: 'Category mean accuracy', unit: '%', better: 'higher', note: 'Unweighted mean accuracy across the four task categories.' },
    datasetMeanAcc: { name: 'Dataset mean accuracy', unit: '%', better: 'higher', note: 'Unweighted mean accuracy across all 44 NLI test sets.' },
    accSkill: { name: 'Accuracy skill index', unit: 'index', better: 'higher', note: 'Chance-normalized accuracy skill score across categories.' },
    auroc: { name: 'AUROC', unit: '%', better: 'higher', note: 'Macro area under the ROC curve across NLI datasets.' },
    throughput: { name: 'Throughput', better: 'higher', note: 'Pre-tokenized forward-pass throughput in short NLI pairs per second on an idle GPU.' },
    throughputLong: { name: 'Long-pair throughput', better: 'higher', note: 'Pre-tokenized forward-pass throughput in long-context NLI pairs per second on an idle GPU.' },
    ece: { name: 'Calibration error (ECE)', unit: 'score', better: 'lower', note: 'Temperature-scaled expected calibration error across evaluated predictions.' },
    eceRaw: { name: 'Raw calibration error', unit: 'score', better: 'lower', note: 'Uncalibrated expected calibration error before temperature scaling.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = JSON.parse(await fetchText(FEED)) as OpenNliBoard;
    const rows: LeaderboardRow[] = [];
    for (const m of data.models ?? []) {
      const score = pct(m.skill?.overall);
      if (!m.id || score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const k of ['nli', 'reasoning', 'grounding', 'domain'] as const) {
        const v = pct(m.cats?.[k]);
        if (v !== undefined) metrics[k] = v;
      }
      const cma = pct(m.overall);
      if (cma !== undefined) metrics.categoryMeanAcc = cma;
      const dma = pct(m.dataset_mean);
      if (dma !== undefined) metrics.datasetMeanAcc = dma;
      const ask = pct(m.acc_skill?.overall);
      if (ask !== undefined) metrics.accSkill = ask;
      const auc = pct(m.auroc?.overall);
      if (auc !== undefined) metrics.auroc = auc;
      if (typeof m.throughput === 'number' && Number.isFinite(m.throughput)) metrics.throughput = m.throughput;
      if (typeof m.throughput_long === 'number' && Number.isFinite(m.throughput_long)) metrics.throughputLong = m.throughput_long;
      if (typeof m.calibration?.ece === 'number' && Number.isFinite(m.calibration.ece)) metrics.ece = m.calibration.ece;
      if (typeof m.calibration?.ece_raw === 'number' && Number.isFinite(m.calibration.ece_raw)) metrics.eceRaw = m.calibration.ece_raw;

      const params = typeof m.params === 'number' && Number.isFinite(m.params) && m.params > 0 ? +(m.params / 1e9).toFixed(4) : undefined;
      const link = m.id.includes('/') ? `https://huggingface.co/${m.id}` : undefined;
      const submitter = m.org?.trim() || undefined;

      rows.push({
        model: m.id,
        score,
        ...(params !== undefined ? { params } : {}),
        ...(submitter ? { submitter } : {}),
        ...(link && /^https?:\/\/\S+$/.test(link) ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
