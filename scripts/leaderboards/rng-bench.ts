// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// RNGBench tests memory in two games. The README reports percent of pairs matched and the maze aggregate score.
// The separate head-to-head protocol supplies additional metrics for five of the six single-player models.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/InternLM/RNGBench/HEAD/README.md';
function read(source: string, header: string) {
  const start = source.indexOf(header);
  if (start < 0) throw new Error('Missing table ' + header);
  const lines = source.slice(start).split(/\n\s*\n/, 1)[0].split('\n').slice(2);
  return new Map(lines.map(line => {
    const [model, ...fields] = line.replace(/<img[^>]*>|\*\*/g, '').trim().split('|').slice(1, -1).map(c => c.trim());
    if (!model || fields.length !== header.split('|').length - 3 || fields.some(c => !/^\d+(\.\d+)?$/.test(c))) throw new Error('Invalid game result');
    return [model, fields.map(Number)];
  }));
}
const board: Leaderboard = {
  benchmark: 'rng-bench', url: 'https://github.com/InternLM/RNGBench#main-results', feed,
  terms: 'MIT license. https://github.com/InternLM/RNGBench/blob/HEAD/LICENSE',
  headline: 'The board reports no overall score, so this is the plain mean of its two single-player game scores.',
  parts: { pairs: 'Matching Pairs', maze: '3D Maze' },
  async fetch() {
    const main = (await fetchText(feed)).split('## Main Results')[1]?.split('### October')[0];
    if (!main) throw new Error('Missing main results');
    const pairs = read(main, '| Model | PF%↓ | IA%↓ | Resp./Score↓ | Score%↑ |');
    const maze = read(main, '| Model | SR%↑ | Explore%↑ | Walls↓ | Eff.%↑ | GS%↑ |');
    const duel = read(main, '| Model | Win%↑ | W | T | L | Score%↑ | ELO↑ |');
    const rows = [];
    for (const [model, [parseFailure, invalidAction, responsesPerPair, pairScore]] of pairs) {
      const m = maze.get(model);
      if (!m) continue;
      const [success, explore, walls, efficiency, mazeScore] = m;
      const metrics: Record<string, number> = { pairs: pairScore, maze: mazeScore, parseFailure, invalidAction, responsesPerPair, success, explore, walls, efficiency };
      const d = duel.get(model);
      if (d) ['duelWinRate', 'duelWins', 'duelTies', 'duelLosses', 'duelScore', 'duelElo'].forEach((key, i) => { metrics[key] = d[i]; });
      rows.push({ model, score: (pairScore + mazeScore) / 2, setting: 'Single-player, 10×10 image pairs and 13×13 maze without minimap', metrics });
    }
    return checked(rows, 6);
  },
};
export default board;
