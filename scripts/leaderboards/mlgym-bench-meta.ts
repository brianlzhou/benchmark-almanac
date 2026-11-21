// MLGym-Bench tests agents on thirteen machine learning research tasks.
// Meta's aggregate CSV ranks models by the area under their performance profile over four attempts.
// The best and last CSVs retain the best attempt and best final submission in each task's native metric.
import type { Leaderboard, BoardPart, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const base = 'https://raw.githubusercontent.com/facebookresearch/MLGym/HEAD/results/tables/';
const feed = base + 'aup_scores_aggregate_results.csv';
const board: Leaderboard = {
  benchmark: 'mlgym-bench-meta', feed, url: 'https://github.com/facebookresearch/MLGym/tree/main/results/tables',
  terms: 'CC BY-NC 4.0. https://github.com/facebookresearch/MLGym/blob/main/LICENSE',
  aliases: { 'gpt-o1': 'o1', 'gpt-o3-mini': 'o3-mini', 'llama4-17b-16': 'llama-4-scout', 'llama4-17b-128': 'llama-4-maverick',
    'claude-35-sonnet-new': 'claude-3-5-sonnet-october-2024', 'claude-37-sonnet': 'claude-3-7-sonnet' },
  async fetch() {
    const overall = parseCsv(await fetchText(feed)).filter(r => r.Model !== 'baseline');
    const parts: Record<string, BoardPart> = {};
    const rows: LeaderboardRow[] = [];
    for (const [file, headline, setting] of [['best', 'Best AUP', 'Best attempt'], ['last', 'Last AUP', 'Best submission']]) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const tasks = parseCsv(await fetchText(base + file + '_scores_aggregate_results.csv'));
      if (tasks.length !== 13 || !tasks.every(t => t.Task)) throw Error('Missing MLGym tasks');
      for (const r of overall) {
        if (!r.Model || !r[headline]?.trim()) throw Error('Missing model or AUP');
        const metrics: Record<string, number> = {};
        for (const t of tasks) {
          const name = t.Task;
          const accuracy = ['CIFAR-10', 'Fashion MNIST', 'MNLI'].includes(name);
          parts[name] = { name, unit: accuracy ? '%' : 'score', ...(name === '3-SAT' || name === 'Language Modeling' ? { better: 'lower' as const } : {}) };
          if (!(r.Model in t)) throw Error('Missing MLGym model column: ' + r.Model);
          if (!t[r.Model].trim()) continue;
          const value = Number(t[r.Model]);
          if (!Number.isFinite(value)) throw Error('Invalid MLGym task value');
          metrics[name] = value * (accuracy && name !== 'MNLI' ? 100 : 1);
        }
        rows.push({ model: r.Model, score: Number(r[headline]), setting, metrics, trials: 4 });
      }
    }
    board.parts = parts;
    return checked(rows, 24);
  },
};
export default board;
