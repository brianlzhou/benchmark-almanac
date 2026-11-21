// RPC-Bench grades answers to paper reviewers. Its Gradio table sorts by Informativeness.
// The Space prefers the seed CSV and displays a row for each input configuration.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const url = "https://huggingface.co/spaces/zai-org/RPC-Bench";
const feed = "https://huggingface.co/spaces/zai-org/RPC-Bench/raw/main/data/leaderboard_seed.csv";

const board: Leaderboard = {
  benchmark: 'rpc-bench', url, feed,
  terms: "The Hugging Face Space declares Apache License 2.0. https://huggingface.co/spaces/zai-org/RPC-Bench" ,
  stats: {
    Conciseness: { name: 'Conciseness score', unit: 'score', better: 'higher' },
    Correctness: { name: 'Correctness score', unit: 'score', better: 'higher' },
    Completeness: { name: 'Completeness score', unit: 'score', better: 'higher' },
    'F1-like': { name: 'F1-like score', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const data = parseCsv(await fetchText(feed));
    const measures = ['Conciseness', 'Correctness', 'Completeness', 'F1-like', 'Informativeness'];
    if (data.length < 28) throw new Error('Expected at least 28 RPC-Bench rows');
    return data.map(r => {
      const link = r.Model?.match(/^\[(.+)\]\((https?:\/\/.+)\)$/);
      if (!link || !r['Input Config'] || !r.Organization || !r.Date) throw new Error('Missing model details');
      const metrics: Record<string, number> = {};
      for (const key of measures) {
        if (!r[key]?.trim() || !Number.isFinite(Number(r[key]))) throw new Error('Missing ' + key);
        metrics[key] = Number(r[key]);
      }
      const score = metrics.Informativeness;
      delete metrics.Informativeness;
      return { model: link[1], setting: r['Input Config'], link: link[2], score, metrics };
    });
  },
};
export default board;
