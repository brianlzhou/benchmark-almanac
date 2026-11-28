// BETU SLM Leaderboard (BananaMind): evaluates sub-1B open-weight language models across 6 tasks
// (HellaSwag, ARC-Easy, PIQA, ArithMark-3.0, Tiny Theory of Mind, and BananaMind Base Bench 1.1).
// Reads data/config.json and data/models.jsonl and reproduces the Space's exact Overall Index
// formula from app.js: Quality = chance-normalized weighted mean, Overall Index = Quality +
// size_weight * (Quality - expected_peer_Quality).
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const BASE = 'https://huggingface.co/spaces/BananaMind/BETU-SLM-Leaderboard/raw/main';
const FEED = `${BASE}/data/models.jsonl`;
const CONFIG = `${BASE}/data/config.json`;

interface BetuConfig {
  benchmarks: { key: string; chance: number; weight: number }[];
  size_efficiency?: { weight?: number; min_peers?: number };
}

interface BetuModel {
  id: string;
  name?: string;
  org?: string;
  params: number;
  scores: Record<string, number>;
  bench_elo?: number;
  license?: string;
  submitted_by?: string;
  run_at?: string;
}

const WINDOWS: readonly [number, number][] = [
  [200e6, 20e6],
  [100e6, 10e6],
  [50e6, 10e6],
  [20e6, 5e6],
  [10e6, 3e6],
  [5e6, 2e6],
  [2e6, 1e6],
  [1e6, 200e3],
  [500e3, 100e3],
  [150e3, 50e3],
  [0, 30e3],
];

function localSizeWindow(params: number): number {
  for (const [above, win] of WINDOWS) if (params > above) return win;
  return 30e3;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function lineFit(points: [number, number][]): { intercept: number; slope: number } {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p[0], 0) / n;
  const my = points.reduce((s, p) => s + p[1], 0) / n;
  const vx = points.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  const slope = vx ? points.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / vx : 0;
  return { intercept: my - slope * mx, slope };
}

const board: Leaderboard = {
  benchmark: 'betu-slm-leaderboard',
  url: 'https://huggingface.co/spaces/BananaMind/BETU-SLM-Leaderboard',
  feed: FEED,
  terms: 'Public Hugging Face Space leaderboard published by BananaMind.',
  parts: {
    hellaswag: { name: 'HellaSwag', unit: '%', better: 'higher' },
    arcEasy: { name: 'ARC-Easy', unit: '%', better: 'higher' },
    piqa: { name: 'PIQA', unit: '%', better: 'higher' },
    arithmark3: { name: 'ArithMark-3.0', unit: '%', better: 'higher' },
    tinyTom: { name: 'Tiny Theory of Mind', unit: '%', better: 'higher' },
    bananamindBaseBench: { name: 'BananaMind Base Bench 1.1', unit: '%', better: 'higher' },
  },
  stats: {
    qualityIndex: { name: 'Quality index', unit: 'index', better: 'higher', note: 'Weighted chance-normalized score across all six benchmarks (0 = chance, 100 = perfect).' },
    sizeResidual: { name: 'Size efficiency residual', unit: 'score', better: 'higher', note: 'Quality index minus the median quality of peers in the same parameter-size window.' },
    benchElo: { name: 'BananaMind Base Bench Elo', unit: 'elo', better: 'higher', note: 'Fixed-item Elo rating on BananaMind Base Bench 1.1.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const [cfgText, jsonl] = await Promise.all([fetchText(CONFIG), fetchText(FEED)]);
    const cfg = JSON.parse(cfgText) as BetuConfig;
    const rawModels = jsonl
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((l) => JSON.parse(l) as BetuModel);

    interface Scored {
      raw: BetuModel;
      quality: number;
    }
    const scored: Scored[] = [];
    for (const m of rawModels) {
      if (!m.id || !(m.params > 0)) continue;
      let total = 0;
      let weighted = 0;
      let complete = true;
      for (const b of cfg.benchmarks) {
        const acc = m.scores?.[b.key];
        if (typeof acc !== 'number' || !Number.isFinite(acc)) {
          complete = false;
          break;
        }
        total += b.weight;
        weighted += b.weight * (((acc - b.chance) / (100 - b.chance)) * 100);
      }
      if (!complete || total <= 0) continue;
      scored.push({ raw: m, quality: weighted / total });
    }

    const weight = cfg.size_efficiency?.weight ?? 0.25;
    const minPeers = cfg.size_efficiency?.min_peers ?? 3;
    const rows: LeaderboardRow[] = [];

    for (const item of scored) {
      const m = item.raw;
      const others = scored.filter((o) => o !== item);
      let expected = item.quality;
      if (weight && others.length) {
        const win = localSizeWindow(m.params);
        const close = others.filter((o) => Math.abs(o.raw.params - m.params) <= win);
        if (close.length >= minPeers) {
          expected = median(close.map((o) => o.quality));
        } else if (others.length >= 2) {
          const fit = lineFit(others.map((o) => [Math.log10(o.raw.params), o.quality]));
          expected = fit.intercept + fit.slope * Math.log10(m.params);
        }
      }
      const residual = item.quality - expected;
      const overallIndex = item.quality + weight * residual;

      const metrics: Record<string, number> = {
        hellaswag: m.scores.hellaswag,
        arcEasy: m.scores.arc_easy,
        piqa: m.scores.piqa,
        arithmark3: m.scores.arithmark3,
        tinyTom: m.scores.tiny_tom,
        bananamindBaseBench: m.scores.bananamind_base_bench,
        qualityIndex: +item.quality.toFixed(2),
        sizeResidual: +residual.toFixed(2),
      };
      if (typeof m.bench_elo === 'number' && Number.isFinite(m.bench_elo)) metrics.benchElo = m.bench_elo;

      const date = m.run_at && /^\d{4}-\d{2}-\d{2}/.test(m.run_at) ? m.run_at.slice(0, 10) : undefined;
      const link = m.id.includes('/') ? `https://huggingface.co/${m.id}` : undefined;

      rows.push({
        model: m.id,
        score: +overallIndex.toFixed(2),
        open: true,
        params: +(m.params / 1e9).toFixed(6),
        ...(m.license ? { license: m.license.trim() } : {}),
        ...(m.submitted_by ? { submitter: m.submitted_by.trim() } : {}),
        ...(date ? { date } : {}),
        ...(link && /^https?:\/\/\S+$/.test(link) ? { link } : {}),
        metrics,
      });
    }
    return rows;
  },
};

export default board;
