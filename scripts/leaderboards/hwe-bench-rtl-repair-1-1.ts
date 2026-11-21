// HWE-Bench v1.1 scores the share of 417 RTL bugs repaired. The versioned JSON contains totals and resolved cases per repository.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";

const board: Leaderboard = {
  benchmark: "hwe-bench-rtl-repair-1-1",
  url: "https://pku-liang.github.io/hwe-bench/",
  feed: "https://pku-liang.github.io/hwe-bench/scores-v1.1.json",
  terms: "The author repository uses Apache License 2.0. https://raw.githubusercontent.com/pku-liang/hwe-bench/main/LICENSE The project host serves no robots.txt.",
  costPer: "run",
  async fetch() {
    const {benchmark,models} = JSON.parse(await fetchText(this.feed));
    const repos: {id:string,name:string,cases:number}[] = benchmark.repos;
    if (benchmark.version !== 'v1.1' || benchmark.total !== 417 || repos.length !== 6 || models.length < 7) throw new Error('HWE-Bench version or coverage changed');
    this.parts = Object.fromEntries(repos.map(r => [r.id,r.name]));
    return models.map((m: {name:string,effort?:string,agent:string,group:string,overall:number,costs:number,tokens:{input:number,cached:number,output:number},precision:number,resolved:Record<string,number>}) => {
      const metrics: Record<string,number> = {precision:m.precision*100,inputTokensTotal:m.tokens.input,cachedTokensTotal:m.tokens.cached,outputTokensTotal:m.tokens.output};
      for (const r of repos) metrics[r.id] = 100*m.resolved[r.id]/r.cases;
      if (!m.name || !Number.isFinite(m.overall) || !Object.values(metrics).every(Number.isFinite)) throw new Error('Incomplete HWE-Bench result');
      return {model:m.name,score:100*m.overall/benchmark.total,cost:m.costs,tokens:m.tokens.output/benchmark.total,open:m.group==='open-source',harness:m.agent,setting:m.effort,metrics};
    });
  },
};
export default board;
