// 67AI Lab grades answers to nuclear medicine guideline questions.
// Its results table reports fully correct answers as a percentage of 120 answerable questions.
import type { Leaderboard } from './types.ts';
import { tables, num } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://67ailab.com/posts/spark-eval-06-l3-guideline-qa/';
const board: Leaderboard = {
  benchmark: '67ai-l3-guideline-qa',
  url, feed: url,
  terms: '67AI Lab publishes these scores without separate reuse terms. Its robots.txt permits the page.',
  aliases: { 'Opus 5.5': 'claude-opus-5-5' },
  parts: { retrieved: 'Correct when right passage retrieved', abstention: 'Correct abstention' },
  stats: {
    worstRunWrongDoses: { name: 'Wrong doses in worst run', unit: 'count', better: 'lower' },
    deltaVsOpus: { name: 'Difference versus Opus', unit: '%', better: 'higher' },
  },
  async fetch() {
    const table = tables(await fetchText(url)).find(t => t[0]?.[1]?.text === 'Fully correct');
    const headers = ['Model', 'Fully correct', 'Correct when right passage retrieved', 'Correct abstention', 'Wrong doses, worst run', 'Δ vs Opus', 'Verdict'];
    if (!table || headers.some((h, i) => table[0][i]?.text !== h) || table.length < 8) throw new Error('Incomplete guideline results table');
    return table.slice(1).map(cells => {
      const [model, score, retrieved, abstention, doses, delta, verdict] = cells.map(c => c.text);
      const values = [score, retrieved, abstention, doses].map(num);
      if (!model || values.some(v => v === undefined)) throw new Error('Incomplete guideline result');
      return { model, score: values[0]!, trials: ['reference', 'baseline'].includes(verdict) ? 1 : 3,
        metrics: { retrieved: values[1]!, abstention: values[2]!, worstRunWrongDoses: values[3]!,
          ...(num(delta.replace('−', '-')) !== undefined ? { deltaVsOpus: num(delta.replace('−', '-'))! } : {}) } };
    });
  },
};
export default board;
