// 67AI Lab tests extraction from synthetic nuclear medicine reports.
// The results table gives field F1 on a scale from zero to one and cost per thousand reports.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://67ailab.com/posts/spark-eval-05-l2-report-structuring/";
const board: Leaderboard = {
  benchmark: '67ai-l2-report-structuring',
  url: "https://67ailab.com/posts/spark-eval-05-l2-report-structuring/",
  feed,
  terms: "The publisher allows this path in robots.txt. The publisher gives no separate reuse terms for the score table. https://67ailab.com/posts/spark-eval-05-l2-report-structuring/",
  stats: {
    validJson: { name: 'Valid JSON rate', unit: '%', better: 'higher' },
    contradictionRecall: { name: 'Contradiction recall', unit: 'score', better: 'higher', note: 'Share of contradictions caught.' },
    falseAlarmRate: { name: 'False alarm rate', unit: 'score', better: 'lower' },
    decodeTokensPerSecond: { name: 'Decode tokens per second', unit: 'tokens/s', better: 'higher' },
  },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[1]?.text === 'Field F1');
    const headers = ['Model', 'Field F1', 'Valid JSON', 'Contradictions caught', 'False alarms', 'Decode tok/s', '$ / 1k reports', 'Verdict'];
    if (!table || headers.some((h, i) => table[0][i]?.text !== h) || table.length < 8)
      throw new Error('Missing report structuring results');
    return table.slice(1).map(row => {
      const [model, f1, valid, caught, falseAlarms, speed, cost, verdict] = row.map(c => c.text);
      const values = [f1, valid, caught, falseAlarms, cost].map(num);
      if (!model || values.some(v => v === undefined)) throw new Error('Incomplete report structuring row');
      const decode = num(speed);
      return { model, score: values[0]!, cost: values[4]! / 1000,
        trials: verdict === 'small model ready' ? 3 : undefined,
        metrics: { validJson: values[1]!, contradictionRecall: values[2]!, falseAlarmRate: values[3]!,
          ...(decode === undefined ? {} : { decodeTokensPerSecond: decode }) } };
    });
  },
};
export default board;
