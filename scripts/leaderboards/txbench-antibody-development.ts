// LatchBio publishes a percentage score across 60 antibody-development evaluations. The V1 results identify each model version and harness.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { BIO_ALIASES } from './biosecbench-refusal.ts';

const feed = "https://benchmarks.bio/benchmarks/txbench-abdev/latest.json";
interface Results {
 results:{model:string;harness:string;scorePct:number;modelVariant:string|null}[];
}

const board: Leaderboard = {
  benchmark: "txbench-antibody-development",
  url: "https://benchmarks.bio/txbench-abdev",
  feed,
  terms: "The publisher supplies a citation and download on the board. https://benchmarks.bio/txbench-abdev The site permits crawling in robots.txt.",
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
