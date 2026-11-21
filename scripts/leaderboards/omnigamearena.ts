// OmniGameArena tests game-playing agents in solo, cooperative, and competitive games.
// The project site's cold-start tables report game scores and head-to-head win rates.
// The headline uses the first solo game because win rates and gameplay scores measure different outcomes.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://mxlin043.github.io/OmniGameArena/webpage/data.js';
interface Scores { games: string[]; rows: { name: string; cells: [number, number][] }[] }
interface Matchups { cols: string[]; games: { game: string; rows: { name: string; cells: (number | null)[] }[] }[] }
const board: Leaderboard = {
  benchmark: 'omnigamearena', url: 'https://mxlin043.github.io/OmniGameArena/#results', feed,
  terms: 'Source attribution and project terms are available at https://github.com/mxlin043/OmniGameArena.',
  headline: 'The site reports each game separately. The headline is the cold-start score on ObstacleRun2D, its first solo game.',
  async fetch() {
    const payload = (await fetchText(feed)).match(/^window\.OGA_DATA\s*=\s*(\{.*\});?\s*$/ms)?.[1];
    if (!payload) throw new Error('Missing OmniGameArena data');
    const { cold } = JSON.parse(payload) as { cold: { solo: Scores; coop: Scores; pvp: Matchups } };
    if (cold.solo.games[0] !== 'ObstacleRun2D' || cold.solo.games.length !== 7 || cold.coop.games.length !== 2 ||
        cold.pvp.games.length !== 3) throw new Error('OmniGameArena games changed');
    const parts: Record<string, BoardPart> = {};
    const rows = new Map<string, LeaderboardRow>();
    for (const [group, table] of [['Solo', cold.solo], ['Coop', cold.coop]] as const) {
      for (const [i, game] of table.games.entries()) {
        parts[game] = { name: game, group };
        for (const { name, cells } of table.rows) {
          if (/^(Random|Human expert)$/.test(name)) continue;
          const [mean, std] = cells[i];
          if (!Number.isFinite(mean) || !Number.isFinite(std)) throw new Error('Missing game score or deviation');
          if (game === 'ObstacleRun2D') rows.set(name, { model: name, score: mean, trials: 5, setting: 'Cold start', metrics: { std } });
          const metrics = rows.get(name)?.metrics;
          if (!metrics) throw new Error('Unknown agent in game scores');
          metrics[game] = mean;
          metrics[game + 'Std'] = std;
        }
      }
    }
    for (const { game, rows: opponents } of cold.pvp.games) {
      for (const { name, cells } of opponents) {
        const metrics = rows.get(name)?.metrics;
        if (!metrics || cells.length !== cold.pvp.cols.length) throw new Error('Unexpected matchup table');
        for (const [i, winRate] of cells.entries()) {
          if (cold.pvp.cols[i] === name && winRate === null) continue;
          if (winRate === null || !Number.isFinite(winRate)) throw new Error('Missing head-to-head win rate');
          const key = game + 'Vs' + cold.pvp.cols[i].replace(/[^a-z0-9]/gi, '');
          parts[key] = { name: game + ' vs. ' + cold.pvp.cols[i], group: 'PvP', unit: '%', note: 'Win rate across ten matches.' };
          metrics[key] = winRate * 100;
        }
      }
    }
    board.parts = parts;
    return checked([...rows.values()], 12);
  },
};
export default board;
