// RareDiseaseBench grades rare-disease diagnoses and management plans. LatchBio publishes the percentage score for each model and harness in its results JSON.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { BIO_ALIASES } from './biosecbench-refusal.ts';

const feed = "https://benchmarks.bio/benchmarks/rarediseasebench/latest.json";

const board: Leaderboard = {
  benchmark: "rarediseasebench-latchbio",
  url: "https://benchmarks.bio/raredisease",
  feed,
  terms: "The publisher supplies a citation and download on the board. https://benchmarks.bio/raredisease robots.txt allows this feed.",
  aliases: BIO_ALIASES,
  async fetch() {
    type Run = {model: string, harness: string, scorePct: number, modelVariant?: string};
    const d = await fetchJson<{benchmark: {id:string}, results: Run[]}>(feed);
    if (d.benchmark.id !== 'rarediseasebench' || d.results.length < 31) throw new Error('Missing rare-disease results');
    return d.results.map(r => {
      if (!r.model || !r.harness || !Number.isFinite(r.scorePct)) throw new Error('Incomplete ranked run');
      return {model: r.model.replace(/\*$/, ''), harness: r.harness, score: r.scorePct, setting: r.modelVariant || undefined};
    });
  },
};

export default board;
