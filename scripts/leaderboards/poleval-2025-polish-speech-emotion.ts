// PolEval ranks speech emotion recognition submissions by macro F1 on the hidden Polish test set.
// The evaluation portal supplies each entry's description, submitter, date and unrounded score.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const feed = "https://poleval-api.amueval.pl/evaluation/Polish%20Speech%20Emotion%20Recognition%20%E2%80%93%20Test%20B/leaderboard";
const board: Leaderboard = {
  benchmark: 'poleval-2025-polish-speech-emotion',
  url: "https://poleval.pl/2025/results/",
  feed,
  terms: "PolEval robots.txt restricts /data/. The results page links to the public evaluation portal and gives no separate reuse license.",
  async fetch() {
    const entries = await fetchJson<{ description: string; submitter: string; timestamp: string; main_metric_result: number }[]>(feed);
    if (entries.length < 6) throw new Error('Missing PolEval Test B results');
    return entries.map(r => {
      if (!r.description || !r.submitter || !r.timestamp || !Number.isFinite(r.main_metric_result)) throw new Error('Invalid Test B submission');
      return { model: r.description, submitter: r.submitter, date: r.timestamp.slice(0, 10), score: r.main_metric_result };
    });
  },
};
export default board;
