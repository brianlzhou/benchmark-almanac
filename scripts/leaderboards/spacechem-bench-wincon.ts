// Wincon ranks SpaceChem agents by proximity to community records. Its model CSV also counts solved puzzles and new frontier points.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/wincon-research/spacechem-bench/main/models.csv";

const board: Leaderboard = {
  benchmark: "spacechem-bench-wincon",
  url: "https://spacechem.wincon.dev/#leaderboard",
  feed,
  terms: "Wincon publishes its data under the MIT license and requests credit for individual solutions. https://huggingface.co/datasets/wincon-research/spacechem-bench The feed host returns no robots.txt.",
  aliases: {"Opus 5.5": "claude-opus-5-5", "Sonnet 5.5": "claude-sonnet-5-5", "Haiku 5.5": "claude-haiku-5-5", "Fable 5.1": "claude-fable-5-1"},
  stats: {
    sum_score: { name: 'Sum score', unit: 'score', better: 'higher' },
    hypervolume_3d: { name: 'Three-dimensional hypervolume', unit: 'score', better: 'higher' },
    frontier_coverage: { name: 'Frontier coverage', unit: '%', better: 'higher' },
    puzzles_with_new_frontier_points: { name: 'Puzzles with new frontier points', unit: 'count' },
    new_frontier_points: { name: 'New frontier points', unit: 'count' },
    puzzles_solved: { name: 'Puzzles solved', unit: 'count', better: 'higher' },
    single_reactor_solved: { name: 'Single-reactor puzzles solved', unit: 'count', better: 'higher' },
    multi_reactor_solved: { name: 'Multi-reactor puzzles solved', unit: 'count', better: 'higher' },
  },
  async fetch() {
    const source = await fetchText(feed);
    const records = parseCsv(source);
    const columns = ["model", "record_proximity", "sum_score", "hypervolume_3d", "frontier_coverage", "puzzles_with_new_frontier_points", "new_frontier_points", "puzzles_solved", "single_reactor_solved", "multi_reactor_solved"];
    if (!records[0] || !columns.every(key => key in records[0])) throw new Error('Missing result columns');
    const rows: LeaderboardRow[] = [];
    for (const record of records) {
      const model = record["model"].trim();
      const score = Number.parseFloat(record["record_proximity"]);
      if (!model || !Number.isFinite(score)) throw new Error('Missing model or score');
      const row: LeaderboardRow = { model, score };
      row.metrics = {};
      for (const [column, key] of Object.entries({"sum_score": "sum_score", "hypervolume_3d": "hypervolume_3d", "frontier_coverage": "frontier_coverage", "puzzles_with_new_frontier_points": "puzzles_with_new_frontier_points", "new_frontier_points": "new_frontier_points", "puzzles_solved": "puzzles_solved", "single_reactor_solved": "single_reactor_solved", "multi_reactor_solved": "multi_reactor_solved"})) {
        const value = Number.parseFloat(record[column]);
        if (Number.isFinite(value)) row.metrics[key] = value;
      }

      rows.push(row);
    }
    if (rows.length < 16) throw new Error('Incomplete leaderboard');
    return rows;
  },
};
export default board;
