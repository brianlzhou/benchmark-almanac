// SciTaste compares judgments of research value against reference scores in six disciplines.
// The dataset's evaluation report ranks configurations with two overall scores. We use its first score.
// Each configuration also has scores by discipline and the count of successful responses.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://huggingface.co/datasets/skylenage/SciTaste-benchmark';
const feed = url + '/raw/main/最终评测/OSS_上传包_多学科创新性评测/results/evaluation_results_report.md';
const subjects = { '化学': 'Chemistry', '医学': 'Medicine', '数学': 'Mathematics', '物理': 'Physics',
  '生物学': 'Biology', '金融学': 'Finance' } as const;
const cells = (line: string) => line.trim().split('|').slice(1, -1).map(x => x.trim());
function number(s: string) {
  if (!/^[+-]?\d+(\.\d+)?(?:%| \[[A-F]\])?$/.test(s)) throw new Error('Invalid result: ' + s);
  return parseFloat(s);
}
export default {
  benchmark: 'scitaste-bench', url, feed,
  terms: 'The dataset card specifies the MIT license. ' + url,
  parts: Object.fromEntries([
    ...Object.values(subjects).map(name => ({ key: name.toLowerCase(), name, unit: 'score' as const })),
    { key: 'method2', name: 'Method 2 score', unit: 'score' },
    { key: 'spearman', name: 'Spearman correlation', unit: 'score' },
    { key: 'pearson', name: 'Pearson correlation', unit: 'score' },
  ].map(({ key, ...part }) => [key, part])),
  async fetch() {
    const report = await fetchText(feed);
    const sections = report.split(/^### /m);
    const rows = sections.slice(1).filter(section => section.includes('| **总体** |')).map(section => {
      const [title, header, , total, ...rest] = section.split(/\r?\n/);
      const config = /^(.+?)（([^，]+)，成功 (\d+)\/(\d+)）$/.exec(title.trim());
      if (!config || cells(header)[7] !== '方式1 Score' || cells(header)[10] !== '方式2 Score')
        throw new Error('Unexpected SciTaste results section');
      const c = cells(total);
      const metrics: Record<string, number> = { method2: number(c[10]), spearman: number(c[2]), pearson: number(c[3]),
        mae: number(c[4]), rmse: number(c[5]), bias: number(c[6]), wape: number(c[8]), smape: number(c[9]),
        successful: Number(config[3]) };
      for (const [label, name] of Object.entries(subjects)) {
        const row = rest.map(cells).find(r => r[0] === label);
        if (!row) throw new Error('Missing discipline: ' + name);
        metrics[name.toLowerCase()] = number(row[7]);
      }
      const mode = config[1];
      return { model: config[2], score: number(c[7]), trials: Number(config[4]), metrics,
        harness: mode.startsWith('DimAgent') ? 'DimAgent-v3' : undefined,
        setting: mode === 'DimAgent + Native' ? 'Native search' : mode === 'DimAgent-v3' ? 'ADS tools' : mode };
    });
    return checked(rows, 28);
  },
} satisfies Leaderboard;
