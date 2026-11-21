// InsureBench ranks model and harness combinations by mean accuracy. The public report supplies intervals, item counts and per-task costs.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";

const board: Leaderboard = {
  benchmark: "insurebench-multifunctional-llms",
  url: "https://insurebench.insure-thing.com/#leaderboard",
  feed: "https://insurebench.insure-thing.com/data/report.json",
  terms: "InsureThing posts aggregate results. Its launch page carries a copyright notice and gives no reuse license. https://www.insure-thing.com/blog/insurebench-rating-the-model-and-the-harness The host allows crawlers in robots.txt.",
  aliases: {"nemotron-3-ultra-550b-a55b":"nemotron-3-ultra","nemotron-3-super-120b-a12b":"nemotron-3-super"},
  async fetch() {
    const {meta,combos} = JSON.parse(await fetchText(this.feed));
    if (combos.length < 14 || combos.length !== meta.n_combos) throw new Error('Incomplete InsureBench report');
    return combos.map((r:{short:string,harness:string,mean:number,ci_lo:number,ci_hi:number,n_items:number,cost_metered:number|null,cost_notional:number|null,tokens_per_task:number}) => {
      if (!r.short || !r.harness || ![r.mean,r.ci_lo,r.ci_hi,r.n_items].every(Number.isFinite)) throw new Error('Incomplete InsureBench combination');
      const effort = r.short.match(/-(low|high)$/)?.[1];
      const metrics: Record<string,number> = {items:r.n_items,totalTokens:r.tokens_per_task};
      if (r.cost_metered != null) metrics.meteredCost = r.cost_metered;
      if (r.cost_notional != null) metrics.notionalCost = r.cost_notional;
      return { model:effort ? r.short.slice(0,-effort.length-1) : r.short, setting:effort, harness:r.harness,
        score:r.mean, low:r.ci_lo, high:r.ci_hi, cost:(r.cost_metered || r.cost_notional) ?? undefined, metrics };
    });
  },
};
export default board;
