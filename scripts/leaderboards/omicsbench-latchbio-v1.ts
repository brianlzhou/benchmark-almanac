// OmicsBench v1 tests agents on 741 short-horizon and 43 long-horizon bioinformatics tasks.
// The source reports no overall score, so the headline is the plain mean of the two horizon pass rates.
// This importer reads the fixed Figure 2 values in the authors' paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const values: [string, number, number][] = [
  ['DeepSeek V4.1-F / Pi', 45.8, 20.3], ['GPT-5.5 / Pi', 41.6, 26.7], ['GPT-5.6 Luna / Pi', 35.2, 17.7],
  ['GPT-5.6 Sol / CX', 43.3, 32.8], ['GPT-5.6 Sol / Pi', 41.9, 32.6], ['GPT-6 Astra / CX', 47.0, 32.0],
  ['GPT-6 Astra / Pi', 49.3, 32.3], ['GPT-6 Luna / Pi', 37.3, 16.9], ['GPT-6 Sol / CX', 44.9, 28.8],
  ['GPT-6 Sol / Pi', 44.9, 29.9], ['Gemini 3.7-F / Pi', 39.6, 24.1], ['Gemini 3.8-F / Pi', 35.9, 24.1],
  ['Grok 4.6 / GB', 47.2, 21.5], ['Grok 4.6 / Pi', 48.8, 21.2], ['Grok 4.7 / GB', 49.4, 17.2],
  ['Grok 4.7 / Pi', 48.9, 20.8], ['Kimi K3 / Pi', 40.1, 18.3], ['Opus 4.7 / CC', 39.1, 20.3],
  ['Opus 4.7 / Pi', 39.0, 18.6], ['Opus 4.8 / CC', 41.8, 24.1], ['Opus 4.8 / Pi', 44.3, 24.7],
  ['Opus 5 / CC', 47.7, 27.6], ['Opus 5 / Pi', 47.2, 27.6], ['Opus 5.5 / CC', 42.7, 16.6],
  ['Opus 5.5 / Pi', 43.0, 13.4], ['Sonnet 4.6 / CC', 33.1, 13.7], ['Sonnet 4.6 / Pi', 32.6, 15.4],
  ['Sonnet 5 / CC', 39.4, 18.0], ['Sonnet 5 / Pi', 40.5, 20.1],
];
const board: Leaderboard = {
  benchmark: 'omicsbench-latchbio-v1', static: 'paper',
  url: 'https://blog.latch.bio/p/omicsbench-v1-a-latch-meta-benchmark', feed: 'https://latch.bio/omicsbench',
  terms: 'LatchBio publishes the paper publicly. Figure 2 is credited to the authors.',
  headline: 'The paper reports no overall score, so this is the plain mean of its short-horizon and long-horizon pass rates.',
  parts: { shortHorizon: { name: 'Short horizon', unit: '%' }, longHorizon: { name: 'Long horizon', unit: '%' } },
  async fetch(): Promise<LeaderboardRow[]> {
    return values.map(([entry, short, long]) => { const [model, harness] = entry.split(' / '); return { model, harness, score: (short + long) / 2, metrics: { shortHorizon: short, longHorizon: long } }; });
  },
};
export default board;
