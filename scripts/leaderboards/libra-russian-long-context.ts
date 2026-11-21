// LIBRA tests long-context understanding in Russian. The leaderboard displays total_score on a 0 to 100 scale.
// The authors publish one JSON result per model and define the task labels in datasets_config.json.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { setTimeout as delay } from 'node:timers/promises';

const url = 'https://huggingface.co/spaces/ai-forever/LIBRA-Leaderboard';
const feed = 'https://huggingface.co/api/spaces/ai-forever/LIBRA-Leaderboard/tree/main/results';
function fraction(value: unknown): number {
  if (typeof value !== 'number' || !(value >= 0 && value <= 1)) throw new Error('Invalid LIBRA score');
  return value;
}
const display = (n: number) => Number((n * 100).toFixed(1));
const board: Leaderboard = {
  benchmark: 'libra-russian-long-context', url, feed,
  terms: 'The authors license the leaderboard under MIT. https://huggingface.co/spaces/ai-forever/LIBRA-Leaderboard/blob/main/README.md',
  aliases: {
    'LiquidAI_LFM2.5-1.2B-Instruct': 'lfm2-5-1-2b-instruct',
    'Qwen_Qwen3-30B-A3B-Instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025',
    'Qwen_Qwen3.5-0.8B': 'qwen3-5-0-8b', 'Qwen_Qwen3.5-2B': 'qwen3-5-2b',
    'Qwen_Qwen3.5-4B': 'qwen3-5-4b', 'Qwen_Qwen3.5-9B': 'qwen3-5-9b',
    'Qwen_Qwen3.5-35B-A3B': 'qwen3-5-35b-a3b', 'Qwen_Qwen3.5-122B-A10B': 'qwen3-5-122b-a10b',
    'microsoft_Phi-3.5-mini-instruct': 'phi-3-5-mini',
  },
  async fetch() {
    const files = await fetchJson<{ path: string }[]>(feed);
    await delay(1000);
    const config = await fetchJson<Record<string, { name: string }>>(url + '/raw/main/datasets_config.json');
    const parts: NonNullable<Leaderboard['parts']> = {};
    const rows: LeaderboardRow[] = [];
    for (const { path } of files.filter(f => /^results\/[^/]+\.json$/.test(f.path))) {
      await delay(1000);
      const result = await fetchJson<Record<string, unknown>>(url + '/raw/main/' + path);
      const metrics: Record<string, number> = {};
      const lengths = new Map<string, number[]>();
      for (const [key, { name }] of Object.entries(config)) {
        const task = result[key] as Record<string, unknown>;
        metrics[key] = display(fraction(task.dataset_total_score));
        parts[key] = { name: name.replace(/ \*$/, ''), group: 'Task' };
        for (const [length, value] of Object.entries(task)) {
          if (length === 'dataset_total_score') continue;
          if (!/^\d+k$/.test(length)) throw new Error('Unknown context length');
          const values = lengths.get(length) ?? [];
          values.push(fraction(value));
          lengths.set(length, values);
        }
      }
      for (const [length, values] of lengths) {
        parts[length] = { name: length, group: 'Context length' };
        metrics[length] = display(values.reduce((a, b) => a + b, 0) / values.length);
      }
      rows.push({ model: path.slice(8, -5), score: display(fraction(result.total_score)), metrics });
    }
    board.parts = parts;
    return checked(rows, 13);
  },
};
export default board;
