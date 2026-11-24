// The Bengali.AI private-test leaderboard ranks ASR systems by corpus word error rate.
// Its CSV reports fractions for the corpus and ten regions. The importer converts them to percentages.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://huggingface.co/datasets/bengaliAI/ben10-asr-results/raw/main/results.csv";
const board: Leaderboard = {
  benchmark: "ben-10-regional-asr",
  url: "https://huggingface.co/spaces/bengaliAI/ben10-asr-leaderboard",
  feed,
  terms: "The maintainer publishes corpus word error as a fraction and retains the test audio and transcripts. The results table uses CC BY 4.0. Hugging Face robots.txt permits the results file.",
  parts: {
    barishal: { name: 'Barishal', group: 'Region' },
    chittagong: { name: 'Chittagong', group: 'Region' },
    habiganj: { name: 'Habiganj', group: 'Region' },
    kishoreganj: { name: 'Kishoreganj', group: 'Region' },
    narail: { name: 'Narail', group: 'Region' },
    narsingdi: { name: 'Narsingdi', group: 'Region' },
    rangpur: { name: 'Rangpur', group: 'Region' },
    sandwip: { name: 'Sandwip', group: 'Region' },
    sylhet: { name: 'Sylhet', group: 'Region' },
    tangail: { name: 'Tangail', group: 'Region' },
  },
  async fetch() {
    const entries = parseCsv(await fetchText(feed));
    if (!entries.length) throw new Error('Missing Ben-10 results');
    return entries.map(r => {
      const regions = JSON.parse(r.wer_by_region) as Record<string, number>;
      if (!r.model_id || !r.wer?.trim() || !Number.isFinite(Number(r.wer)) || Object.keys(regions).length < 10) throw new Error('Incomplete Ben-10 result');
      const metrics: Record<string, number> = {};
      for (const [region, rate] of Object.entries(regions)) {
        if (!Number.isFinite(rate)) throw new Error('Invalid regional WER');
        metrics[region] = 100 * rate;
      }
      return { model: r.model_id, score: 100 * Number(r.wer), metrics, date: r.evaluated_at, link: r.model_url,
        harness: r.backend, submitter: r.requested_by };
    });
  },
};
export default board;
