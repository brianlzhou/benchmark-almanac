// CADClamp 0.1 scores printability across two CAD languages. The earlier frontier grid in the README gives their average.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/ChristianNHill/cadclamp/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "cadclamp-0-1",
  url: "https://github.com/ChristianNHill/cadclamp#earlier-results-frontier-grid-v01-dev",
  feed,
  terms: "The maker licenses prompts and results under CDLA-Permissive-2.0. https://github.com/ChristianNHill/cadclamp/blob/main/licenses/LICENSE-DATA The feed host returns no robots.txt.",
  parts: {"build123d": "build123d", "OpenSCAD": "OpenSCAD"},
  async fetch() {
    const required = ["Model", "avg", "build123d", "OpenSCAD"];
    const table = markdownTables((await fetchText(feed)).split('## Earlier results: frontier grid v0.1-dev')[1] ?? '')
      .find(([header]) => header && required.every(name => header.includes(name)));
    if (!table || table.length <= 15) throw new Error('Incomplete score table');
    const [header, ...entries] = table;
    return entries.map(cells => {
      const cell = (name: string) => cells[header.indexOf(name)];
      const model = cell("Model");
      const score = num(cell("avg"));
      if (!model || score === undefined) throw new Error('Missing model or headline score');
      const row: LeaderboardRow = { model, score };
      row.metrics = {};
      for (const name of Object.keys(board.parts!)) {
        const value = num(cell(name));
        if (value === undefined) throw new Error('Missing part score: ' + name);
        row.metrics[name] = value;
      }
      row.trials = 3;
      return row;
    });
  },
};
export default board;
