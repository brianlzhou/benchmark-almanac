// KuralHub compares emotion recognition models on Urdu-Dataset. Its runs CSV reports held-out accuracy as a fraction and F1 for each emotion.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://aaivu.github.io/KuralHub/data/runs.csv";

const emotions = ['anger', 'happiness', 'neutral', 'sadness'];
const measures = ['val_accuracy', 'test_macro_precision', 'test_macro_recall', 'test_macro_f1', 'test_weighted_f1'];

const board: Leaderboard = {
  benchmark: "urdu-language-speech-emotional-corpus",
  url: "https://aaivu.github.io/KuralHub/languages/urdu.html",
  feed: FEED,
  terms: "Filter the CSV by dataset Urdu-Dataset. The repository applies MIT to code and documentation. Individual datasets retain their terms. https://github.com/aaivu/KuralHub The site returns a 404 page for robots.txt.",
  parts: Object.fromEntries(emotions.map((name) => [name, { name, group: 'Emotion F1', unit: '%' }])),
  async fetch() {
    const runs = parseCsv(await fetchText(FEED)).filter((r) => r.language === 'Urdu' && r.dataset === 'Urdu-Dataset');
    if (runs.length < 11) throw new Error('Expected at least 11 Urdu-Dataset runs');
    return runs.map((r) => {
      const percent = (key: string) => {
        if (!r[key]?.trim() || !Number.isFinite(Number(r[key]))) throw new Error(`Missing ${key} in ${r.run_id}`);
        return Number(r[key]) * 100;
      };
      if (!r.model || !r.run_id) throw new Error('Missing model name or run ID');
      const metrics = Object.fromEntries(measures.map((key) => [key, percent(key)]));
      for (const emotion of emotions) metrics[emotion] = percent('test_f1_' + emotion);
      return { model: r.model, score: percent('test_accuracy'), metrics,
        link: 'https://github.com/aaivu/KuralHub/tree/main/results/train_val_test_logs/' + encodeURIComponent(r.run_id) };
    });
  },
};
export default board;
