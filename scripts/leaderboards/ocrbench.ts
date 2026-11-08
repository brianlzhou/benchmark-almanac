// OCRBench v1: the official Space publishes Final Score as correct answers out of 1,000.
// Divide Final Score by 10 to match the catalog percentage and lab reports (885 becomes 88.5).
// Category counts stay in metrics on their published count scale. OCRBench v2 has its own record.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/echo840/ocrbench-leaderboard/resolve/main/OCRBench.csv';
const board: Leaderboard = {
  benchmark: 'ocrbench',
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
      metrics: Object.fromEntries(['Text Recognition', 'Scene Text-Centric VQA', 'Doc-Oriented VQA', 'KIE', 'HMER'].flatMap(k =>
        r[k]?.trim() && Number.isFinite(Number(r[k])) ? [[k, Number(r[k])]] : [])),
    }));
  },
};
export default board;
