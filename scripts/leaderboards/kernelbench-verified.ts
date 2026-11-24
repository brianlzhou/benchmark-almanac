// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// The board ranks by Fast@1, the percentage of problems where the best correct kernel beats PyTorch on H200.
// FP32 and BF16 are separate settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://scalingintelligence.stanford.edu/kernelbenchverifiedleaderboard/';
const levels = ['Level 1', 'Level 2', 'Level 3'];
const labels = ['Correct Speedup', 'Correctness %', 'Fast@1', 'Correct Mem Eff', 'Mem Efficient %'];
const board: Leaderboard = {
  benchmark: 'kernelbench-verified', url: feed, feed,
  terms: 'The authors link the code license and their leaderboard at https://github.com/facebookresearch/kernel_bench_verified.',
  headline: 'The board reports no overall score, so this is the plain mean of Fast@1 across three levels.',
  parts: Object.fromEntries(levels.map(name => [name, name])),
  stats: Object.fromEntries(levels.flatMap(level => labels.filter(n => n !== 'Fast@1').map(name =>
    [level + ': ' + name, { name: level + ': ' + name, better: 'higher', unit: name.includes('%') ? '%' : name === 'Correct Speedup' ? 'speedup' : 'score' }]))),
  async fetch() {
    const html = await fetchText(feed);
    const rows = new Map<string, LeaderboardRow>();
    for (const precision of ['fp32', 'bf16']) {
      for (const [i, level] of levels.entries()) {
        const id = 'agg-' + precision + '-' + (i + 1);
        const match = html.match(new RegExp('<table\\b[^>]*id=["\']' + id + '["\'][^>]*>[\\s\\S]*?</table>'));
        const table = match && tables(match[0])[0];
        if (!table || table[1].filter(c => c.text).map(c => c.text.replace(' ↑', '')).join('|') !== labels.join('|')) throw new Error('Missing KernelBench table ' + id);
        for (const cells of table.slice(2)) {
          const [raw, ...values] = cells.filter(c => c.text).map(c => c.text);
          if (values.every(v => v === '—' || v === '-')) continue;
          const model = raw.replace(/ \(([^)]+)\)$/, '');
          const effort = raw.match(/ \(([^)]+)\)$/)?.[1];
          const setting = [precision.toUpperCase(), effort].filter(Boolean).join(', ');
          const key = JSON.stringify([model, setting]);
          const row = rows.get(key) ?? { model, setting, trials: 5, score: 0, metrics: {} };
          values.forEach((v, j) => {
            if (!/^\d+(?:\.\d+)?%?$/.test(v)) throw new Error('Invalid KernelBench value ' + v);
            row.metrics![j === 2 ? level : level + ': ' + labels[j]] = parseFloat(v);
          });
          rows.set(key, row);
        }
      }
    }
    const complete = [...rows.values()].filter(r => levels.every(k => k in r.metrics!));
    for (const row of complete) row.score = Number((levels.reduce((sum, k) => sum + row.metrics![k], 0) / 3).toFixed(6));
    return checked(complete, 14);
  },
};
export default board;
