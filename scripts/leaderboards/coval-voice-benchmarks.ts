// Coval times live voice services. Its first modality, speech to text, ranks time to final segment.
// The headline is mean latency in milliseconds for the last 24 hours. Lower is better.
// The board embeds its ranked snapshot and per-model timing, accuracy and sample counts in the STT page.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

interface Entry {
  provider: string; model: string; metric_type: string; avg_value: number; sample_count: number;
  insufficient_samples: boolean; stddev_value: number; p25: number; p50: number; p75: number; p90: number; p95: number;
}
const feed = 'https://benchmarks.coval.ai/stt';
const board: Leaderboard = {
  benchmark: 'coval-voice-benchmarks', url: feed, feed,
  terms: 'Coval publishes its methodology under Apache 2.0. https://github.com/coval-ai/benchmarks/blob/main/LICENSE',
  headline: 'Coval ranks speech-to-text services by mean time to the final segment over the last 24 hours, so this is that latency in milliseconds. Lower is better.',
  async fetch() {
    const source = nextFlight(await fetchText(feed));
    if (!source.includes('"sortSpecKey":"TTFS"') || !source.includes('last 24 hours')) throw new Error('STT ranking changed');
    const entries = jsonAfter<Entry[]>(source, '"entries":');
    const ranked = entries.filter(e => e.metric_type === 'TTFS' && e.insufficient_samples === false);
    if (ranked.length < 2) throw new Error('Missing ranked time to final segment entries');
    return checked(ranked.map(entry => {
      const metrics: Record<string, number> = { std: entry.stddev_value * 1000, p25: entry.p25 * 1000,
        p50: entry.p50 * 1000, p75: entry.p75 * 1000, p90: entry.p90 * 1000, p95: entry.p95 * 1000 };
      for (const e of entries.filter(e => e.provider === entry.provider && e.model === entry.model && !e.insufficient_samples)) {
        if (!Number.isFinite(e.avg_value)) throw new Error('Missing metric for ' + e.model);
        metrics[e.metric_type] = e.avg_value;
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Missing STT distribution');
      return { model: entry.model, setting: entry.provider + ' speech to text, last 24 hours',
        score: entry.avg_value * 1000, trials: entry.sample_count, metrics };
    }), ranked.length);
  },
};
export default board;
