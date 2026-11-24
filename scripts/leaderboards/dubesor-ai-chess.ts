// Dubesor rates chess games in mixed, reasoning and continuation modes. Read the official text snapshot for each rating, uncertainty and per-game cost.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://dubesor.de/chess/chess-leaderboard-llm.txt";
const board: Leaderboard = {
  benchmark: "dubesor-ai-chess",
  url: "https://dubesor.de/chess/chess-leaderboard",
  feed: FEED,
  terms: "The maker marks the game interface code as MIT. The leaderboard gives no separate license for its scores. https://dubesor.de/chess/ The text snapshot is allowed by robots.txt.",
  stats: {
    wins: { name: 'Wins', unit: 'count' }, draws: { name: 'Draws', unit: 'count' }, losses: { name: 'Losses', unit: 'count' },
    accuracy: { name: 'Accuracy', unit: '%', better: 'higher' }, blunderRate: { name: 'Blunder rate', unit: '%', better: 'lower' },
    winRate: { name: 'Win rate', unit: '%', better: 'higher' }, material: { name: 'Material balance', unit: 'score', better: 'higher' },
    turns: { name: 'Turns', unit: 'count' }, tokensPerMove: { name: 'Tokens per move', unit: 'tokens' },
    secondsPerMove: { name: 'Seconds per move', unit: 'seconds', better: 'lower' },
    legalReasoning: { name: 'Legal reasoning rate', unit: '%', better: 'higher' }, legalContinuation: { name: 'Legal continuation rate', unit: '%', better: 'higher' },
    legal: { name: 'Legal move rate', unit: '%', better: 'higher' },
  },
  chart: {
    title: 'Elo vs. cost per game',
    x: { key: 'cost', label: 'Cost per game', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Elo', unit: 'Elo', better: 'higher' },
    note: 'Dubesor plots chess Elo rating against average cost per game on a log scale with a Pareto frontier.',
  },
  async fetch() {
    const source = await fetchText(FEED);
    const rows = [];
    for (const setting of ['Mixed Modes', 'Reasoning', 'Continuation']) {
      const section = source.split('## Detailed Player Statistics: 5+ games, ' + setting + ' (')[1]?.split('## ')[0];
      const count = Number(section?.match(/^(\d+) models\)/)?.[1]);
      const table = markdownTables(section ?? '')[0];
      if (!count || table?.length !== count + 1 || table[0].join('|') !== '#|Model|Elo|Cost|Games|W-D-L|Acc|Blunder|WR|Mat|Turns|Tok|Spd|Legal') throw new Error('Incomplete Dubesor ' + setting);
      for (const [, name, elo, cost, games, wdl, ...stats] of table.slice(1)) {
        if (['maia5-1500', 'random-mover', 'Human'].includes(name) || elo === '-') continue;
        const rating = elo.match(/^(\d+)(?: ±(\d+))?$/);
        if (!rating || !Number(games)) throw new Error('Invalid Elo for ' + name);
        const score = Number(rating[1]);
        const spread = Number(rating[2]);
        const [wins, draws, losses] = wdl.split('-').map(Number);
        const metrics: Record<string, number> = { wins, draws, losses };
        ['accuracy','blunderRate','winRate','material','turns','tokensPerMove','secondsPerMove'].forEach((key, i) => {
          if (stats[i] !== '-') metrics[key] = parseFloat(stats[i]);
        });
        stats[7].split(' / ').forEach((v, i) => {
          if (v !== '-') metrics[setting === 'Mixed Modes' ? (i ? 'legalContinuation' : 'legalReasoning') : 'legal'] = parseFloat(v);
        });
        rows.push({ model: name.replace(/ ˟$/, ''), setting, score, trials: Number(games), metrics,
          ...(Number.isFinite(spread) ? { low: score - spread, high: score + spread } : {}),
          ...(cost.includes('$') ? { cost: Number(cost.replace(/^~?\$/, '')) } : {}) });
      }
    }
    return rows;
  },
};
export default board;
