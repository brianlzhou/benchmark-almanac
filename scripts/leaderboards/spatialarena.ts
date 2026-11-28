import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://mvp-ai-lab.github.io/SpatialArena/data/results_live.json';

interface TaskScore {
  score?: number;
}

interface RankingRow {
  method: string;
  method_display?: string;
  has_auxiliary_input?: boolean;
  score?: number;
  average_rank?: number;
  coverage?: number;
  first_place_wins?: number;
  task_scores?: Record<string, TaskScore>;
}

interface Payload {
  generated_at?: string;
  ranking?: { rows?: RankingRow[] };
}

const r2 = (v: number): number => Math.round(v * 100) / 100;

const TASK_MAP: [string, string][] = [
  ['MonoDepth', 'monoDepth'],
  ['VideoDepth', 'videoDepth'],
  ['MVRecon', 'mvRecon'],
  ['SfM', 'sfm'],
  ['SLAM', 'slam'],
];

const board: Leaderboard = {
  benchmark: 'spatialarena',
  url: 'https://mvp-ai-lab.github.io/SpatialArena/',
  feed: FEED,
  terms: 'Public live leaderboard JSON published by MVP Lab on GitHub Pages.',
  parts: {
    monoDepth: 'Monocular depth',
    videoDepth: 'Video depth',
    mvRecon: 'Multi-view reconstruction',
    sfm: 'Structure from motion',
    slam: 'SLAM',
  },
  stats: {
    averageRank: {
      name: 'Average rank',
      unit: 'score',
      better: 'lower',
      note: 'Mean rank across evaluated tasks and datasets.',
    },
    coverage: {
      name: 'Evaluated cases',
      unit: 'count',
      note: 'Number of benchmark scenes scored for this model.',
    },
    firstPlaceWins: {
      name: 'First-place wins',
      unit: 'count',
      better: 'higher',
      note: 'Number of per-scene metric comparisons won by this model.',
    },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Payload;
    const genDate = data.generated_at?.slice(0, 10);
    const validDate = genDate && /^\d{4}-\d{2}-\d{2}$/.test(genDate) ? genDate : undefined;

    const rows: LeaderboardRow[] = [];
    for (const r of data.ranking?.rows ?? []) {
      const model = (r.method_display || r.method || '').trim();
      if (!model || typeof r.score !== 'number' || !Number.isFinite(r.score)) continue;
      const metrics: Record<string, number> = {};
      for (const [src, dst] of TASK_MAP) {
        const s = r.task_scores?.[src]?.score;
        if (typeof s === 'number' && Number.isFinite(s)) metrics[dst] = r2(s);
      }
      if (typeof r.average_rank === 'number' && Number.isFinite(r.average_rank)) {
        metrics.averageRank = r2(r.average_rank);
      }
      if (typeof r.coverage === 'number' && Number.isFinite(r.coverage)) {
        metrics.coverage = r.coverage;
      }
      if (typeof r.first_place_wins === 'number' && Number.isFinite(r.first_place_wins)) {
        metrics.firstPlaceWins = r.first_place_wins;
      }
      const row: LeaderboardRow = {
        model,
        score: r2(r.score),
        metrics,
      };
      if (validDate) row.date = validDate;
      rows.push(row);
    }
    return rows;
  },
};

export default board;
