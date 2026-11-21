// AutoBench compares answers to agronomy questions using model judges. Its December 2025 run CSV gives the AutoBench score, cost and response times.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/AutoBench/AutoBench-Leaderboard/raw/main/runs/agro1_2025-12-10/summary_data.csv";

const board: Leaderboard = {
  benchmark: "autobench-agronomy",
  url: "https://huggingface.co/spaces/AutoBench/AutoBench-Leaderboard",
  feed: FEED,
  terms: "The Space declares the MIT license. The agronomy run has its own results CSV. https://huggingface.co/spaces/AutoBench/AutoBench-Leaderboard Hugging Face allows crawling in robots.txt.",
  stats: { iterations:{name:'Iterations',unit:'count'}, latency:{name:'Average answer duration',unit:'seconds',better:'lower'}, p99Latency:{name:'99th percentile answer duration',unit:'seconds',better:'lower'}, failRate:{name:'Failure rate',unit:'%',better:'lower'} },
  async fetch() {
    const records = parseCsv((await fetchText(FEED)).trimStart());
    if (records.length < 40) throw new Error('Expected forty AutoBench models');
    return records.map((r) => {
      const number = (key: string) => {
        const value = r[key]?.replace(/%$/, '').trim();
        if (!value || !Number.isFinite(Number(value))) throw new Error(`Invalid ${key} for ${r.Model}`);
        return Number(value);
      };
      if (!r.Model) throw new Error('Missing model name');
      return { model: r.Model, score: number('AutoBench'), cost: number('Costs (USD)'),
        metrics: { iterations: number('Iterations'), latency: number('Avg Answer Duration (sec)'),
          p99Latency: number('P99 Answer Duration (sec)'), failRate: number('Fail Rate %') } };
    });
  },
};
export default board;
