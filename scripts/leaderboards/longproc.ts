// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// LongProc measures long procedural generation at three output lengths.
// The official detailed results CSV begins with the published average at each length.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://princeton-pli.github.io/LongProc/data/full_results.csv';
const lengths = ['0.5K', '2K', '8K'];
const groups = ['Average', 'HTML to TSV', 'Travel Planning', 'ToM Tracking', 'Path Traversal', 'Countdown', 'Pseudocode to Code'];
const names = groups.flatMap(group => lengths.map(length => group + ': ' + length));
export default {
  benchmark: 'longproc', url: 'https://princeton-pli.github.io/LongProc/#leaderboard', feed,
  terms: 'The authors publish these results at https://princeton-pli.github.io/LongProc/',
  headline: 'The leaderboard reports a separate average at each length, so the headline is the plain mean of its three length averages.',
  parts: Object.fromEntries(names.map(name => [name, {name, unit: 'score' as const}])),
  aliases: {'Gemini-1.5-pro-001': 'gemini-1-5-pro-may-2024', 'Gemini-1.5-flash-001': 'gemini-1-5-flash-may-2024',
    'GPT-4o-2024-08': 'gpt-4o-aug-2024', 'GPT-4o-mini-24-07': 'gpt-4o-mini', 'Claude-3-5-sonnet-2410': 'claude-3-5-sonnet-october-2024',
    'Llama-3.1-70B-Inst': 'llama-3-1-70b', 'Llama-3.1-8B-Inst': 'llama-3-1-8b', 'Llama-3.2-3B-Inst': 'llama-3-2-3b',
    'Llama-3.2-1B-Inst': 'llama-3-2-1b', 'Qwen2.5-72B-Inst': 'qwen2-5-72b', 'Qwen2.5-7B-Inst': 'qwen2-5-7b',
    'Qwen2.5-3B-Inst': 'qwen2-5-3b', 'Phi-3-medium-128k-Inst': 'phi-3-medium-128k-instruct', 'AI21-Jamba-1.5-Mini': 'jamba-1-5-mini'},
  async fetch() {
    const [head, ...lines] = (await fetchText(feed)).trim().split(/\r?\n/);
    if (head !== ['', 'Ctx', ...groups.flatMap(() => lengths)].join(',')) throw new Error('Missing LongProc columns');
    return checked(lines.map(line => {
      const [model, , ...cells] = line.split(',');
      if (cells.length !== names.length || cells.slice(0,3).includes('-')) throw new Error('Missing output length average');
      const metrics: Record<string, number> = {};
      for (const [i, value] of cells.entries()) {
        if (value === '-') continue;
        if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error('Invalid LongProc score: ' + value);
        metrics[names[i]] = Number(value);
      }
      return {model, score: cells.slice(0,3).reduce((sum,v) => sum + Number(v),0) / 3, metrics};
    }), 17);
  },
} satisfies Leaderboard;
