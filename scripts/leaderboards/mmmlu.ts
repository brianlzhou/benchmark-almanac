// OpenAI reports multiple-choice accuracy across 14 professionally translated MMLU test sets.
// The official results table has one model per column and ends with the published Average row.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = 'https://raw.githubusercontent.com/openai/simple-evals/main/multilingual_mmlu_benchmark_results.md';
const board: Leaderboard = {
  benchmark: 'mmmlu', url: 'https://github.com/openai/simple-evals/blob/main/multilingual_mmlu_benchmark_results.md', feed,
  terms: 'OpenAI publishes these benchmark results in its MIT-licensed simple-evals repository.',
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0]?.[0] === 'Language');
    if (!table || table.length < 16 || table[0].length < 11 || table.at(-1)?.[0] !== 'Average') throw new Error('Incomplete MMMLU table');
    const languages = table.slice(1,-1);
    board.parts = Object.fromEntries(languages.map(r => [r[0],r[0]]));
    return table[0].slice(1).map((label,i) => {
      const value = (r: string[]) => {
        const s = r[i + 1];
        if (!s || !Number.isFinite(Number(s))) throw new Error('Missing MMMLU accuracy');
        return Number(s) * 100;
      };
      const high = label.endsWith('-high');
      return { model: high ? label.slice(0,-5) : label, setting: high ? 'high' : undefined,
        score: value(table.at(-1)!), metrics: Object.fromEntries(languages.map(r => [r[0],value(r)])) };
    });
  },
};
export default board;
