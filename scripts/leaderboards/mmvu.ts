// MMVU (Yale NLP), expert-level video understanding. mmvu-benchmark.github.io builds its leaderboard from
// leaderboard_data.json: per entry the model, month, type, frame count, and overall accuracy on the
// validation and test splits. Model cards cite the validation split, so validation overall is the score (the
// two splits sit within about a point of each other on the board). The human baselines are dropped. The
// board gives a month only, so the row date is the month's last day, which lets the resolver pick the
// snapshot that was current that month.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://mmvu-benchmark.github.io/leaderboard_data.json';

interface Entry {
  info: { name: string; date?: string; type?: string; frame?: string };
  validation?: { overall?: string };
  test?: { overall?: string };
}

const lastDay = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

const board: Leaderboard = {
  benchmark: 'mmvu',
  url: 'https://mmvu-benchmark.github.io/#leaderboard',
  feed: `${FEED} (validation overall)`,
  terms: 'Static JSON on the MMVU GitHub Pages site, which states no terms; the MMVU dataset on Hugging Face is Apache-2.0.',
  aliases: {
    'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
    // dated 2024-10 on the board, the October 2024 release
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet-october-2024',
    'Llama-3.2-90B-Vision': 'llama-3-2-90b',
    'Llama-3.2-11B-Vision': 'llama-3-2-11b',
  },
  async fetch() {
    const { leaderboardData } = await fetchJson<{ leaderboardData: Entry[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const e of leaderboardData) {
      if (e.info.type === 'human_expert') continue;
      const score = e.validation?.overall?.trim() ? Number(e.validation.overall) : NaN;
      if (!e.info.name || !Number.isFinite(score)) continue;
      const date = /^\d{4}-\d\d$/.test(e.info.date ?? '') ? lastDay(e.info.date!) : undefined;
      const test = e.test?.overall?.trim() ? Number(e.test.overall) : NaN;
      rows.push({ model: e.info.name.trim(), score, date, setting: e.info.frame && e.info.frame !== '-' ? e.info.frame : undefined, ...(Number.isFinite(test) ? {metrics: {testOverall: test}} : {}) });
    }
    return rows;
  },
};
export default board;
