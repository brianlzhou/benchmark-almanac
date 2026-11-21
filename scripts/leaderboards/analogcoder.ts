// AnalogCoder ranks models by circuits solved out of 24. The README breaks ties by average pass@1.
// The headline converts the solved count to a percentage. Both pass rates remain in the row.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/laiyao1/AnalogCoder/main/README.md";

const board: Leaderboard = {
  benchmark: "analogcoder",
  url: "https://github.com/laiyao1/AnalogCoder#evaluation-of-llms",
  feed,
  terms: "The makers license the repository under MIT. The host has no robots.txt.",
  stats: {
    solved: { name: 'Circuits solved', unit: 'count' },
    pass1: { name: 'Pass@1', unit: '%', better: 'higher' },
    pass5: { name: 'Pass@5', unit: '%', better: 'higher' },
  },
  aliases: {
    'Mixtral-8×7B': 'mixtral-8x7b', 'Codestral-22B': 'codestral', 'Phi3-14B': 'phi-3-medium-14b',
    'DeepSeek-V2-Coder': 'deepseek-coder-v2-236b', 'DeepSeek-V2-Chat': 'deepseek-v2-moe-236b-may-2024',
  },
  harnesses: 'system',
  async fetch() {
    const header = ["LLM Model", "Avg. Pass@1", "Avg. Pass@5", "#Solved"];
    const table = markdownTables(await fetchText(feed)).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 45) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const [label, first, five, count] = cells;
      const variant = label.match(/^(.+?) \((.+)\)$/);
      const solved = Number(count);
      if (![first, five, count].every(v => v?.trim() && Number.isFinite(Number(v)))) throw new Error('Invalid circuit score');
      const harness = variant?.[1] === 'AnalogCoder' ? 'AnalogCoder' : undefined;
      const model = harness ? variant![2].replace(/-based$/, '') : variant?.[1] ?? label;
      return { model, setting: harness ? undefined : variant?.[2], harness, score: solved * 100 / 24,
        metrics: { solved, pass1: Number(first), pass5: Number(five) } };
    });
  },
};
export default board;
