// OCRBench v1: the official Space publishes Final Score as correct answers out of 1,000.
// Divide Final Score by 10 to match the catalog percentage and lab reports (885 becomes 88.5).
// Keep published counts and convert them to category accuracies with the denominators in OCRBench/OCRBench/OCRBench.json.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/echo840/ocrbench-leaderboard/resolve/main/OCRBench.csv';
const categories = {
  'Text Recognition': 300, 'Scene Text-Centric VQA': 200, 'Doc-Oriented VQA': 200, KIE: 200, HMER: 100,
};
const board: Leaderboard = {
  benchmark: 'ocrbench',
  parts: Object.fromEntries(Object.keys(categories).map(name => [name + ' accuracy', name])),
  url: 'https://huggingface.co/spaces/echo840/ocrbench-leaderboard',
  feed: FEED,
  terms: 'The authors publish this public Hugging Face CSV, with attribution retained and no separate score reuse license stated.',
  aliases: { 'Minicpm-V 2.6': 'minicpm-v-2-6' },
  async fetch() {
    const source = parseCsv(await fetchText(FEED));
    if (!source.length || !('Final Score' in source[0])) throw new Error('OCRBench Final Score column missing');
    return source.filter(r => r.Model?.trim() && r['Final Score'].trim() && Number.isFinite(Number(r['Final Score']))).map(r => ({
      model: /^(?:GPT4V|GPT-?4o|Gemini)$/i.test(r.Model.trim()) ? `${r.Model.trim()} (snapshot unspecified)` : r.Model.trim(),
      score: Number(r['Final Score']) / 10,
      open: r['Open Source']?.trim() === 'Yes' ? true : r['Open Source']?.trim() === 'No' ? false : undefined,

      metrics: Object.fromEntries(Object.entries(categories).flatMap(([name, total]) =>
        r[name]?.trim() && Number.isFinite(Number(r[name])) ? [[name, Number(r[name])], [name + ' accuracy', 100 * Number(r[name]) / total]] : [])),
    }));
  },
};
export default board;
