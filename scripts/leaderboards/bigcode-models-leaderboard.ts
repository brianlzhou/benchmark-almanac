// BigCode ranks code models by win rate averaged across languages. Its Space loads this CSV with language pass rates, inference throughput and submission links.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/bigcode/bigcode-models-leaderboard/resolve/main/data/code_eval_board.csv";

const languages = ['humaneval-python', 'java', 'javascript', 'cpp', 'php', 'julia', 'd', 'lua', 'r', 'racket', 'rust', 'swift'];
const measures = { 'Average score': 'averageScore', 'Throughput (tokens/s)': 'throughput',
  'Throughput (tokens/s) bs=50': 'throughputBatch50', 'Peak Memory (MB)': 'peakMemoryMb',
  Seq_length: 'sequenceLength', '#Languages': 'languages' };

const board: Leaderboard = {
  benchmark: "bigcode-models-leaderboard",
  url: "https://huggingface.co/spaces/bigcode/bigcode-models-leaderboard",
  feed: FEED,
  terms: "Check the publisher’s terms at https://huggingface.co/spaces/bigcode/bigcode-models-leaderboard Hugging Face allows crawling in robots.txt.",
  stats: { averageScore: { name: 'Average score', unit: '%', better: 'higher' }, languages: { name: 'Languages', unit: 'count' }, peakMemoryMb: { name: 'Peak memory', unit: 'count' }, sequenceLength: { name: 'Sequence length', unit: 'tokens' }, throughput: { name: 'Throughput', unit: 'tokens/s', better: 'higher' }, throughputBatch50: { name: 'Throughput at batch size 50', unit: 'tokens/s', better: 'higher' } },
  parts: Object.fromEntries(languages.map((name) => [name, { name, group: 'Language' }])),
  async fetch() {
    const data = parseCsv(await fetchText(FEED));
    if (data.length < 60) throw new Error('Expected 60 BigCode models');
    return data.map((r) => {
      const score = Number(r['Win Rate']);
      if (!r.Model || !r['Win Rate']?.trim() || !Number.isFinite(score)) throw new Error('Missing BigCode model or win rate');
      const metrics: Record<string, number> = {};
      for (const [column, key] of [...languages.map((name) => [name, name]), ...Object.entries(measures)]) {
        if (!(column in r)) throw new Error(`Missing ${column}`);
        if (r[column].trim() && Number.isFinite(Number(r[column]))) metrics[key] = Number(r[column]);
      }
      const size = Number(r['Size (B)']);
      return { model: r.Model, score, metrics, params: size > 0 ? size : undefined, link: r['Submission PR'] || r.Links || undefined };
    });
  },
};
export default board;
