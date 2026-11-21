// IUK v1.3 ranks candidates by their foundation screen percentage. RelayForge’s JSON also reports foundation blocks and advanced exams for eligible candidates.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/datasets/ryan-relayforge/iuk-benchmark/raw/main/results/v1.3/benchmark_v1.3.json";
interface Entry { model_name: string; score_pct: number; correct: number; total_questions: number; api_errors: number; mean_score_100: number; run_timestamp: string; provider: string; blocks: Record<string, { pct: number }> }

const board: Leaderboard = {
  benchmark: "iuk-1-3",
  url: "https://huggingface.co/datasets/ryan-relayforge/iuk-benchmark/blob/main/results/v1.3/RESULTS_v1.3.md",
  feed: FEED,
  terms: "RelayForge licenses the results under CC BY 4.0. https://huggingface.co/datasets/ryan-relayforge/iuk-benchmark/blob/main/LICENSE Hugging Face allows crawling.",
  async fetch() {
    const data = await fetchJson<Record<string, Entry[]>>(FEED);
    if (data.t1_leaderboard.length < 15) throw new Error('Expected 15 foundation scores');
    const parts: Record<string, string> = {};
    const rows = data.t1_leaderboard.map(r => {
      if (!r.model_name || !Number.isFinite(r.score_pct) || !r.run_timestamp) throw new Error('Incomplete foundation result');
      const metrics: Record<string, number> = { correct: r.correct, questions: r.total_questions, apiErrors: r.api_errors, meanScore: r.mean_score_100 };
      for (const [key, block] of Object.entries(r.blocks)) { parts[key] = key; metrics[key] = block.pct; }
      for (const [key, label] of Object.entries({ t1_expansion_120q: 'Tier 1 expansion', t2_results_80q: 'Tier 2 (preliminary)', t3_results_100q: 'Tier 3' })) {
        const exam = data[key].find(x => x.model_name === r.model_name);
        if (exam) { metrics[key] = exam.score_pct; parts[key] = label; }
      }
      return { model: r.model_name, harness: r.provider, score: r.score_pct, date: r.run_timestamp.slice(0,10), metrics };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
