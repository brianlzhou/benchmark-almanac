// CATArena compares coding agents in games and optimization tasks. The headline is Gomoku Elo, the first board.
// The other boards use Elo, game points, time AUC or a time ratio. Table 7 identifies the commercial agents' models.
// https://arxiv.org/html/2510.26852
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://catarena.ai/api/ranks/games';
const measures = {
  gomoku: ['Gomoku', 'Elo Rating', 'elo'], pommerman: ['Pommerman', 'Elo Rating', 'elo'],
  holdem: ['Holdem', 'Elo Rating', 'elo'], tetris: ['Tetris', 'Score', 'score'],
  oibench_5: ['OIBench-5', 'Time AUC', 'score'], swe_perf_10: ['SWE-Perf-10', 'Time Ratio', 'speedup'],
} as const;
const commercial: Record<string, [string, string]> = {
  'openai codex': ['GPT-5', 'Codex'], 'gpt codex': ['GPT-5', 'Codex'], 'gemini cli': ['Gemini-2.5-Pro', 'Gemini CLI'],
  'qwen code': ['Qwen3-Coder-480B', 'Qwen Code'], 'qwen code cli': ['Qwen3-Coder-480B', 'Qwen Code'],
  'claude code': ['Claude-4/3.7 Hybrid', 'Claude Code'],
};
type Game = { game_type: keyof typeof measures, game_name: string, score_feild_name: string,
  agents: { name: string, score: number, rank: number }[] };
const board: Leaderboard = {
  benchmark: 'catarena', url: 'https://catarena.ai/leaderboard', feed,
  terms: 'Public results credited to the CATArena organizers. https://catarena.ai/leaderboard',
  harnesses: 'system', reference: ['Minimal'],
  parts: Object.fromEntries(Object.entries(measures).map(([key, [name, note, unit]]) => [key, { name, note, unit, better: 'higher' }])),
  async fetch() {
    const games = await fetchJson<Game[]>(feed);
    const rows = new Map<string, LeaderboardRow>();
    if (games[0]?.game_type !== 'gomoku') throw new Error('First competition changed');
    for (const game of games) {
      const measure = measures[game.game_type];
      if (!measure || measure[0] !== game.game_name || measure[1] !== game.score_feild_name)
        throw new Error('Competition columns changed');
      for (const entry of game.agents) {
        if (entry.name === 'Random') continue;
        const name = entry.name.replace(/_/g, ' ');
        const minimal = name.match(/^(.+) \(Minimal\)$/);
        const identity = minimal ? [minimal[1], 'Minimal'] : commercial[name.toLowerCase()];
        if (!identity || !Number.isFinite(entry.score)) throw new Error('Unknown agent or score');
        const [model, harness] = identity;
        const key = JSON.stringify([model, harness]);
        if (game.game_type === 'gomoku') rows.set(key, { model, harness, score: entry.score, metrics: {} });
        const row = rows.get(key);
        if (row) {
          row.metrics![game.game_type] = entry.score;
        }
      }
    }
    const result = [...rows.values()];
    checked(result.map(row => ({ ...row })), 11);
    return result;
  },
};
export default board;
