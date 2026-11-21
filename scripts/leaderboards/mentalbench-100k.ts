// MentalBench ranks counseling responses by average human rating. The authors publish all seven five-point attributes in their results table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/abeerbadawi/MentalBench-Align/main/Results/Human%20Response%20Evaluation.md";

const board: Leaderboard = {
  benchmark: "mentalbench-100k",
  url: "https://github.com/abeerbadawi/MentalBench-Align/blob/main/Results/Human%20Response%20Evaluation.md",
  feed,
  terms: "The dataset card specifies CC BY-NC-SA 4.0 for the data. The repository license covers its software. https://huggingface.co/datasets/abadawi/MentalBench-Align The feed host returns no robots.txt.",
  parts: {"Guidance": "Guidance", "Informativeness": "Informativeness", "Relevance": "Relevance", "Safety": "Safety", "Empathy": "Empathy", "Helpfulness": "Helpfulness", "Understanding": "Understanding"},
  async fetch() {
    const required = ["Model", "Avg", "Guidance", "Informativeness", "Relevance", "Safety", "Empathy", "Helpfulness", "Understanding"];
    const table = markdownTables(await fetchText(feed))
      .find(([header]) => header && required.every(name => header.includes(name)));
    if (!table || table.length <= 9) throw new Error('Incomplete score table');
    const [header, ...entries] = table;
    return entries.map(cells => {
      const cell = (name: string) => cells[header.indexOf(name)];
      const model = cell("Model");
      const score = num(cell("Avg"));
      if (!model || score === undefined) throw new Error('Missing model or headline score');
      const row: LeaderboardRow = { model, score };
      row.metrics = {};
      for (const name of Object.keys(board.parts!)) {
        const value = num(cell(name));
        if (value === undefined) throw new Error('Missing part score: ' + name);
        row.metrics[name] = value;
      }
      row.open = cell('Source') === 'Open';
      return row;
    });
  },
};
export default board;
