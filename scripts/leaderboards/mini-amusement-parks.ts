// Mini Amusement Parks ranks completed park runs by final park value. The page loads a
// Svelte data file with park layout, difficulty, instruction access, validation, cost and duration.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const feed = "https://maps.skyfall.ai/leaderboard/__data.json";
const board: Leaderboard = {
  benchmark: 'mini-amusement-parks',
  url: "https://maps.skyfall.ai/leaderboard",
  feed,
  terms: "Cloudflare robots.txt disallows several named bots. Skyfall licenses the simulator under MIT and gives no separate license for leaderboard scores.",
  costPer: 'run', verified: 'validated by the leaderboard',
  async fetch() {
    const page = await fetchJson<{nodes: ({data: unknown[]} | null)[]}>(feed);
    const data = page.nodes.find(n => n?.data)?.data;
    if (!data) throw new Error('Missing park data');
    const root = data[0] as {leaderBoardEntries: number};
    const entries = data[root.leaderBoardEntries] as number[];
    if (!Array.isArray(entries) || entries.length < 100) throw new Error('Missing park entries');
    const rows: LeaderboardRow[] = [];
    for (const index of entries) {
      const record = data[index] as Record<string, number>;
      const value = (key: string) => data[record[key]];
      if (value('is_human') === true) continue;
      const name = value('name'), rawScore = value('score');
      if (value('is_human') !== false || !name || rawScore == null || !Number.isFinite(Number(rawScore))) throw new Error('Invalid park entry');
      const setting = ['layout', 'difficulty', 'resource_setting'].map(key => {
        if (!value(key)) throw new Error('Missing park setting: ' + key);
        return String(value(key));
      }).join(', ');
      rows.push({ model: String(name), score: Number(rawScore), setting, verified: value('validated') === true,
        cost: value('cost') == null ? undefined : Number(value('cost')),
        link: (value('repoLink') || value('paperLink') || undefined) as string | undefined,
        metrics: value('timeTaken') == null ? undefined : { durationSeconds: Number(value('timeTaken')) / 1000 } });
    }
    if (rows.length < 48) throw new Error('Missing agent park runs');
    return rows;
  },
};
export default board;
