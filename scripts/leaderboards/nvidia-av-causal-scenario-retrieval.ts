// NVIDIA AV Causal Scenario Retrieval Challenge — NVIDIA autonomous-driving multimodal retrieval leaderboard.
// Reads the live JSON API at https://nvidia-av-causal-scenario-retrieval-challenge.hf.space/api/leaderboard.
// Primary score is Average R-Precision across 1,773 queries, with Easy/Medium/Hard difficulty parts and mAP, P@10, R@10.

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://nvidia-av-causal-scenario-retrieval-challenge.hf.space/api/leaderboard';

interface DifficultyMetrics {
  average_r_precision?: number;
}

interface ApiEntry {
  team?: string;
  score?: number;
  submitted_at?: string;
  metrics?: {
    map?: number;
    precision_at_k?: Record<string, number>;
    recall_at_k?: Record<string, number>;
    by_difficulty?: {
      easy?: DifficultyMetrics;
      medium?: DifficultyMetrics;
      hard?: DifficultyMetrics;
    };
  };
}

const round4 = (v: number) => Math.round(v * 10000) / 10000;

const board: Leaderboard = {
  benchmark: 'nvidia-av-causal-scenario-retrieval',
  feed: FEED,
  url: 'https://huggingface.co/spaces/nvidia/AV-Causal-Scenario-Retrieval-Challenge',
  terms: 'Public Hugging Face Space API published by NVIDIA.',
  parts: {
    easy: { name: 'Easy', group: 'Difficulty' },
    medium: { name: 'Medium', group: 'Difficulty' },
    hard: { name: 'Hard', group: 'Difficulty' },
  },
  stats: {
    map: { name: 'Mean average precision', unit: 'score', better: 'higher' },
    precisionAt10: { name: 'Precision@10', unit: 'score', better: 'higher' },
    recallAt10: { name: 'Recall@10', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<ApiEntry[]>(FEED);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('NVIDIA AV Causal Scenario Retrieval API returned empty list');
    }

    const rows: LeaderboardRow[] = [];
    for (const item of data) {
      const team = item.team?.trim();
      if (!team || typeof item.score !== 'number' || !Number.isFinite(item.score)) continue;
      const metrics: Record<string, number> = {};
      const m = item.metrics;
      if (typeof m?.map === 'number') metrics.map = round4(m.map);
      if (typeof m?.precision_at_k?.['10'] === 'number') metrics.precisionAt10 = round4(m.precision_at_k['10']);
      if (typeof m?.recall_at_k?.['10'] === 'number') metrics.recallAt10 = round4(m.recall_at_k['10']);
      if (typeof m?.by_difficulty?.easy?.average_r_precision === 'number') {
        metrics.easy = round4(m.by_difficulty.easy.average_r_precision);
      }
      if (typeof m?.by_difficulty?.medium?.average_r_precision === 'number') {
        metrics.medium = round4(m.by_difficulty.medium.average_r_precision);
      }
      if (typeof m?.by_difficulty?.hard?.average_r_precision === 'number') {
        metrics.hard = round4(m.by_difficulty.hard.average_r_precision);
      }

      const row: LeaderboardRow = {
        model: team,
        score: round4(item.score),
        metrics,
      };
      if (typeof item.submitted_at === 'string' && /^\d{4}-\d{2}-\d{2}/.test(item.submitted_at)) {
        row.date = item.submitted_at.slice(0, 10);
      }
      rows.push(row);
    }

    if (rows.length < 10) throw new Error(`NVIDIA AV Causal Scenario Retrieval parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;
