// Ramp compares extracted financial values with analysts' transcriptions. Its primary tolerance is 1% relative error.
// The chart reports the match rate as a multiple of the lowest rate and cost as relative cost per request.
import type { Leaderboard } from './types.ts';
import { rampBundle, rampPage, rampTerms } from './accounting-autocoding-ramp.ts';
import { jsLiteral } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const board: Leaderboard = {
  benchmark: 'financial-statement-ocr-ramp', url: rampPage, feed: rampPage, terms: rampTerms + ' ' + rampPage,
  stats: {
    relativeCost: { name: 'Relative cost per request', unit: 'speedup', better: 'lower', note: 'Multiple of the cheapest evaluated model.' },
    tolerance5: { name: 'Match rate at 5% tolerance', unit: 'speedup', better: 'higher', note: 'Multiple of the lowest evaluated match rate at 5% tolerance.' },
    tolerance10: { name: 'Match rate at 10% tolerance', unit: 'speedup', better: 'higher', note: 'Multiple of the lowest evaluated match rate at 10% tolerance.' },
    tolerance25: { name: 'Match rate at 25% tolerance', unit: 'speedup', better: 'higher', note: 'Multiple of the lowest evaluated match rate at 25% tolerance.' },
  },
  chart: {
    title: 'Match rate at 1% tolerance versus relative cost',
    x: { key: 'relativeCost', label: 'Relative cost per request', unit: 'x', better: 'lower', log: true },
    y: { key: 'score', label: 'Match rate at 1% tolerance (multiple of lowest)', unit: 'x', better: 'higher' },
  },
  async fetch() {
    const bundle = await rampBundle();
    const costsAt = bundle.search(/\[\{name:"[^"]+",provider:"[^"]+",rateNx:[\d.]+,costNx:[\d.]+\}/);
    const ratesAt = bundle.search(/\[\{name:"[^"]+",provider:"[^"]+",ratesNx:\{"1%":/);
    if (costsAt < 0 || ratesAt < 0 || !bundle.includes('Match Rate (±1%) vs. Cost per Request')) throw new Error('Missing Ramp match rate charts');
    const costs = jsLiteral<{ name: string; rateNx: number; costNx: number }[]>(bundle, costsAt);
    const rates = jsLiteral<{ name: string; ratesNx: Record<string, number> }[]>(bundle, ratesAt);
    const rows = rates.map(({ name, ratesNx }) => {
      const cost = costs.find(c => c.name === name);
      if (!cost || cost.rateNx !== ratesNx['1%'] || ![cost.costNx, ...['1%', '5%', '10%', '25%'].map(k => ratesNx[k])].every(Number.isFinite)) throw new Error('Mismatch in Ramp OCR series');
      return { model: name, score: ratesNx['1%'], metrics: { relativeCost: cost.costNx, tolerance5: ratesNx['5%'], tolerance10: ratesNx['10%'], tolerance25: ratesNx['25%'] } };
    });
    return checked(rows, 15);
  },
};
export default board;
