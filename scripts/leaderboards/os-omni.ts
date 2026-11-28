import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://os-copilot.github.io/OS-Omni-Home/static/js/osomni-data.js';

const TRACK_KEYS = ['windows', 'linux', 'macos', 'ios', 'android', 'web', 'crossDevice'] as const;

const board: Leaderboard = {
  benchmark: 'os-omni',
  url: 'https://os-copilot.github.io/OS-Omni-Home/#leaderboard',
  feed: FEED,
  terms: 'Public project leaderboard data published by OS-Copilot on GitHub Pages.',
  parts: {
    windows: 'Windows',
    linux: 'Linux',
    macos: 'macOS',
    ios: 'iOS',
    android: 'Android',
    web: 'Web',
    crossDevice: 'Cross-device',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const js = await res.text();
    const match = js.match(/var\s+rows\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) throw new Error('Could not find rows array in osomni-data.js');
    const rawRows = JSON.parse(match[1]) as [string, string, number[], number][];

    const rows: LeaderboardRow[] = [];
    for (const [name, family, scores, average] of rawRows) {
      if (family === 'human') continue;
      if (typeof average !== 'number' || !Number.isFinite(average)) continue;
      const metrics: Record<string, number> = {};
      for (let i = 0; i < TRACK_KEYS.length; i++) {
        const v = scores[i];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[TRACK_KEYS[i]] = v;
      }
      rows.push({
        model: name.trim(),
        score: average,
        setting: 'v1 screenshot-only',
        metrics,
      });
    }
    return rows;
  },
};

export default board;
