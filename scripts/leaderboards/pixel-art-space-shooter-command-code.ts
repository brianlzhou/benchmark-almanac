// Command Code compares six generated pixel art space shooters. Its README ranks the games by the mean of six five-point ratings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/CommandCodeAI/slash-design-showcase/main/pixel-art-space-shooter/readme.md";

const board: Leaderboard = {
  benchmark: "pixel-art-space-shooter-command-code",
  url: "https://github.com/CommandCodeAI/slash-design-showcase/blob/main/pixel-art-space-shooter/readme.md#scorecard",
  feed,
  terms: "The repository has no published score reuse license. The cost column includes estimates. https://github.com/CommandCodeAI/slash-design-showcase The feed host returns no robots.txt.",
  parts: {"Spec fidelity": "Spec fidelity", "Collision": "Collision", "Architecture": "Architecture", "Resize robustness": "Resize robustness", "Polish": "Polish", "Offline-safe": "Offline-safe"},
  async fetch() {
    const required = ["Model", "Mean", "Spec fidelity", "Collision", "Architecture", "Resize robustness", "Polish", "Offline-safe"];
    const table = markdownTables(await fetchText(feed))
      .find(([header]) => header && required.every(name => header.includes(name)));
    if (!table || table.length <= 6) throw new Error('Incomplete score table');
    const [header, ...entries] = table;
    return entries.map(cells => {
      const cell = (name: string) => cells[header.indexOf(name)];
      const model = cell("Model");
      const score = num(cell("Mean"));
      if (!model || score === undefined) throw new Error('Missing model or headline score');
      const row: LeaderboardRow = { model, score };
      row.metrics = {};
      for (const name of Object.keys(board.parts!)) {
        const value = num(cell(name));
        if (value === undefined) throw new Error('Missing part score: ' + name);
        row.metrics[name] = value;
      }
      row.cost = num(cell('Cost'));
      row.trials = 1;
      const quality = num(cell('Quality/$'));
      if (quality !== undefined) row.metrics!.qualityPerDollar = quality;
      return row;
    });
  },
};
export default board;
