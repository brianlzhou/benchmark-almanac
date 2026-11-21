// NativeLongBench compares full-document translations. The model card equally averages its three corpus scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://huggingface.co/IndexTeam/Index-Nailong-9B/raw/main/README.md";

const board: Leaderboard = {
  benchmark: "nativelongbench",
  url: "https://huggingface.co/IndexTeam/Index-Nailong-9B#nativelongbench-evaluation",
  feed,
  terms: "The model card gives the comparison on a 0 to 100 scale. Separate reuse terms for these scores were not identified. https://huggingface.co/IndexTeam/Index-Nailong-9B#nativelongbench-evaluation Hugging Face robots.txt allows this file.",
  parts: { 'GuoFeng zh→en': 'GuoFeng zh→en', 'BWB zh→en': 'BWB zh→en', 'General Books en→zh': 'General Books en→zh' },
  async fetch() {
    const names = ['GuoFeng zh→en', 'BWB zh→en', 'General Books en→zh'];
    const table = markdownTables(await fetchText(feed)).find(t => t[0]?.join('|') === ['Model', ...names].join('|'));
    if (!table || table.length < 5) throw new Error('Missing NativeLongBench comparison');
    return table.slice(1).map(([model, ...cells]) => {
      const values = cells.map(Number);
      if (cells.length !== 3 || cells.some(c => !c) || !values.every(Number.isFinite)) throw new Error('Invalid scores for ' + model);
      return { model, score: Math.round(values.reduce((a, b) => a + b) * 100 / 3) / 100,
        metrics: Object.fromEntries(names.map((name, i) => [name, values[i]])) };
    });
  },
};

export default board;
