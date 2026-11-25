// TissueMicroscopyBench ranks microscopy analysis runs by their percentage score.
// The V1 results download names the harness and variant for each run.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { BIO_ALIASES } from './biosecbench-refusal.ts';

const FEED = "https://benchmarks.bio/benchmarks/tissuemicroscopybench/latest.json";
interface Result { model: string; harness: string; modelVariant: string | null; scorePct: number }
const board: Leaderboard = {
  benchmark: "tissuemicroscopybench-latchbio",
  harnesses: 'system',
  reference: ['Pi'],
  url: "https://benchmarks.bio/tissuemicroscopy",
  feed: FEED,
  terms: "The publisher supplies a citation and download on the board. https://benchmarks.bio/tissuemicroscopy The site allows crawling.",
  aliases: BIO_ALIASES,
  async fetch() {
    const { results } = await fetchJson<{ results: Result[] }>(FEED);
    if (results.length < 30) throw new Error('Missing microscopy runs');
    return results.map(row => {
      if (!row.model || !row.harness || !Number.isFinite(row.scorePct)) throw new Error('Invalid microscopy result');
      return { model: row.model.replace(/\*$/, ''), harness: row.harness, setting: row.modelVariant ?? undefined, score: row.scorePct };
    });
  },
};
export default board;
