// LatchBio ranks neuroscience runs by the percentage of graded conclusions that are correct. Its public V1 results identify each harness and model variant.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { BIO_ALIASES } from './biosecbench-refusal.ts';

const feed = "https://benchmarks.bio/benchmarks/neurosciencebench/latest.json";
interface Results {
 results:{model:string;harness:string;scorePct:number;modelVariant:string|null}[];
}

const board: Leaderboard = {
  benchmark: "neurosciencebench-latchbio",
  harnesses: 'system',
  reference: ['Pi'],
  url: "https://benchmarks.bio/neuroscience",
  feed,
  terms: "The publisher supplies a citation and download on the board. https://benchmarks.bio/neuroscience The site permits crawling in robots.txt.",
  aliases: BIO_ALIASES,
  async fetch() {
    const {results} = await fetchJson<Results>(feed);
    if (results.length < 36) throw new Error('Missing ranked configurations');
    return results.map(r => {
      if (!r.model || !r.harness || !Number.isFinite(r.scorePct)) throw new Error('Missing ranked result');
      return {model:r.model.replace(/\*$/,''),harness:r.harness,setting:r.modelVariant ?? undefined,score:r.scorePct};
    });
  },
};
export default board;
