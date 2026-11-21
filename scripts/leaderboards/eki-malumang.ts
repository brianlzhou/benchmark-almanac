// EKI measures accuracy on 800 Estonian trivia questions. Its summary CSV names each model,
// and its results file reports the same overall accuracy and ten topic scores.
import type { Leaderboard } from './types.ts';
import { fetchJson, fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/keeleinstituut/leaderboard-data-ui/main/summary.csv";
type Result = { modelId: string; details: { trivia_et_3?: { by_topic: Record<string, number>; items: number; det_correct: number; judge_correct: number } } };

const board: Leaderboard = {
  benchmark: "eki-malumang",
  url: "https://xn--mdupuu-pxaa.eki.ee/benchmark/trivia_et_3",
  feed,
  stats: {
    items: { name: 'Items', unit: 'count' },
    exactCorrect: { name: 'Exactly correct answers', unit: 'count', better: 'higher' },
    judgeCorrect: { name: 'Judge accepted answers', unit: 'count', better: 'higher' },
  },
  terms: "EKI licenses the score data under CC BY 4.0. The host has no robots.txt.",
  async fetch() {
    const summary = parseCsv(await fetchText(feed)).filter(r => r.trivia_et_3?.trim());
    await new Promise(resolve => setTimeout(resolve, 1000));
    const details = await fetchJson<Result[]>(new URL('results.json', feed).href);
    const byModel = new Map(details.map(r => [r.modelId, r.details.trivia_et_3]));
    if (summary.length < 93) throw new Error('Incomplete EKI results');
    return summary.map(r => {
      const detail = byModel.get(r.model_id);
      const score = Number(r.trivia_et_3);
      if (!r.name || !Number.isFinite(score) || !detail || Object.keys(detail.by_topic).length < 10)
        throw new Error('Incomplete trivia result for ' + r.model_id);
      board.parts = Object.fromEntries(Object.keys(detail.by_topic).map(topic => [topic, topic]));
      return { model: r.name, score, open: r.tags.split(',').includes('open') || undefined, metrics: {
        ...detail.by_topic, items: detail.items, exactCorrect: detail.det_correct, judgeCorrect: detail.judge_correct,
      } };
    });
  },
};
export default board;
