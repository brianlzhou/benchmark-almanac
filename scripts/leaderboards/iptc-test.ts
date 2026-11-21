// The IPTC news-topic benchmark scores article classification with macro F1. The authors publish aggregate and language-specific F1 in their results JSON.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/TajaKuzman/Benchmarking-Text-Classification-on-South-Slavic/main/IPTC-NewsTopic-Benchmark/results/results.json";
interface Scores { 'Macro F1': number; 'Micro F1': number }
interface Entry extends Scores { Model: string; 'Test Dataset': string; Epochs?: number; 'Learning Rate'?: number; 'Language-Specific Scores': Record<string, Scores> }
export async function classificationScores(feed: string, dataset: string, minimum: number, board: Leaderboard) {
  const data = (await fetchJson<Entry[]>(feed)).filter(r => r['Test Dataset'] === dataset);
  if (data.length < minimum) throw new Error('Missing classification scores for ' + dataset);
  const parts: Record<string, string> = {};
  const rows = data.map(r => {
    const metrics: Record<string, number> = { microF1: r['Micro F1'] };
    for (const [lang, values] of Object.entries(r['Language-Specific Scores'])) {
      metrics[lang] = values['Macro F1']; metrics[lang + '_micro'] = values['Micro F1'];
      parts[lang] = lang + ' macro F1'; parts[lang + '_micro'] = lang + ' micro F1';
    }
    if (!r.Model || !Number.isFinite(r['Macro F1']) || !Object.values(metrics).every(Number.isFinite)) throw new Error('Incomplete classification result');
    if (r.Epochs != null) metrics.epochs = r.Epochs;
    if (r['Learning Rate'] != null) metrics.learningRate = r['Learning Rate'];
    return { model: r.Model, score: r['Macro F1'], metrics };
  });
  board.parts = parts;
  return rows;
}

const board: Leaderboard = {
  benchmark: "iptc-test",
  url: "https://github.com/TajaKuzman/Benchmarking-Text-Classification-on-South-Slavic/tree/main/IPTC-NewsTopic-Benchmark",
  feed: FEED,
  terms: "The score repository states no reuse license for this board. The original development repository is separate. https://github.com/TajaKuzman/Benchmarking-Text-Classification-on-South-Slavic/tree/main/IPTC-NewsTopic-Benchmark GitHub requests a one-second crawl delay.",
  async fetch() {
    return classificationScores(FEED, 'IPTC-test', 20, board);
  },
};
export default board;
