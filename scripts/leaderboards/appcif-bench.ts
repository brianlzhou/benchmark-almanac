// AppCIF-Bench — Tencent bilingual application-level complex instruction following benchmark.
// Parses the const MODELS array purely as data from https://ac2333.github.io/AppCIF/static/main.js.
// Live leaderboard defaults to sorting descending by HSR Avg (column index 10), with L1-L4 and SSR breakdowns.

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://ac2333.github.io/AppCIF/static/main.js';

function parseModelName(raw: string): { model: string; setting?: string } {
  const m = raw.match(/^(.*?)-(xhigh|high|Thinking)$/i);
  if (m) return { model: m[1].trim(), setting: m[2] };
  return { model: raw.trim() };
}

const board: Leaderboard = {
  benchmark: 'appcif-bench',
  feed: FEED,
  url: 'https://ac2333.github.io/AppCIF/#leaderboard',
  terms: 'Public project leaderboard published by Tencent.',
  aliases: {
    'Xiaomi-MiMo-V2-Pro': 'mimo-v2-pro',
    'Xiaomi-MiMo-V2-Omni': 'mimo-v2-omni',
  },
  headline: 'Hard Satisfaction Rate (HSR) average across L1 to L4 difficulty tiers, matching the default sort on the official leaderboard.',
  parts: {
    l1: { name: 'L1', group: 'Difficulty' },
    l2: { name: 'L2', group: 'Difficulty' },
    l3: { name: 'L3', group: 'Difficulty' },
    l4: { name: 'L4', group: 'Difficulty' },
  },
  stats: {
    ssrAvg: { name: 'SSR average', unit: '%', better: 'higher' },
    ssrL1: { name: 'SSR L1', unit: '%', better: 'higher' },
    ssrL2: { name: 'SSR L2', unit: '%', better: 'higher' },
    ssrL3: { name: 'SSR L3', unit: '%', better: 'higher' },
    ssrL4: { name: 'SSR L4', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const js = await fetchText(FEED);
    const m = js.match(/const\s+MODELS\s*=\s*(\[[\s\S]*?\n\]);/);
    if (!m) throw new Error('AppCIF-Bench MODELS array not found in static/main.js');
    const jsonText = m[1].replace(/,\s*(\]|\})/g, '$1');
    const rawRows = JSON.parse(jsonText) as unknown[];

    const rows: LeaderboardRow[] = [];
    for (const entry of rawRows) {
      if (!Array.isArray(entry) || entry.length < 11 || typeof entry[0] !== 'string') continue;
      const nums = entry.slice(1, 11).map(Number);
      if (nums.some((v) => !Number.isFinite(v))) continue;
      const { model, setting } = parseModelName(entry[0]);
      const row: LeaderboardRow = {
        model,
        score: nums[9],
        metrics: {
          ssrL1: nums[0],
          ssrL2: nums[1],
          ssrL3: nums[2],
          ssrL4: nums[3],
          ssrAvg: nums[4],
          l1: nums[5],
          l2: nums[6],
          l3: nums[7],
          l4: nums[8],
        },
      };
      if (setting) row.setting = setting;
      rows.push(row);
    }

    if (rows.length < 10) throw new Error(`AppCIF-Bench parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;
