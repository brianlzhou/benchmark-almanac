// Ramp measures how often an invoice needs no edits. Its chart expresses each perfect extraction rate
// as a multiple of the lowest rate. Cost and latency are also relative measures.
import type { Leaderboard } from './types.ts';
import { rampArray, rampBundle, rampPage, rampTerms } from './accounting-autocoding-ramp.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

type Result = { name: string; rateNx: number; costNx: number; latencyNx: number };
const board: Leaderboard = {
  benchmark: 'contextual-invoice-ocr-ramp', url: rampPage, feed: rampPage, terms: rampTerms + ' ' + rampPage,
  async fetch() {
    const bundle = await rampBundle();
    if (!bundle.includes('Perfect Extraction Rate (multiple of lowest)')) throw new Error('Ramp extraction metric changed');
    const rows = rampArray<Result>(bundle, 'latencyNx', 35).map(r => {
      const name = r.name.match(/^(.+)-(high|medium|low|none|minimal)$/);
      if (!name || ![r.rateNx, r.costNx, r.latencyNx].every(Number.isFinite)) throw new Error('Invalid OCR result');
      return { model: name[1], setting: name[2], score: r.rateNx, metrics: { relativeCost: r.costNx, relativeLatency: r.latencyNx } };
    });
    return checked(rows, 35);
  },
};
export default board;
