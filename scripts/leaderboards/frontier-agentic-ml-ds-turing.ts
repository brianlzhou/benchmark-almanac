// Turing measures mean per-task pass rate on 304 ML and data science tasks. Its app bundle contains the eight configurations, standard errors and resource use.
import type { Leaderboard } from './types.ts';
import { turingPage } from './frontier-agentic-stem-turing.ts';

const FEED = "https://labs.turing.com/";

const board: Leaderboard = {
  benchmark: "frontier-agentic-ml-ds-turing",
  url: "https://labs.turing.com/benchmarks/frontier-agentic-ml-ds",
  feed: FEED,
  terms: "The publisher gives no reuse license on the benchmark page. https://labs.turing.com/benchmarks/frontier-agentic-ml-ds The robots URL serves the app. The reported interval is one pooled standard error. Luna cost uses an internal rate.",
  reference: ['Terminus-2'],
  stats: { latency: { name: 'Runtime', unit: 'seconds', better: 'lower' }, steps: { name: 'Mean steps', unit: 'count' }, toolCalls: { name: 'Mean tool calls', unit: 'count' } },
  async fetch() {
    const page = await turingPage(board.url, 'frontier-agentic-ml-ds');
    const table = page.match(/kind:"results",rows:(\[.*?\]),note:/)?.[1];
    if (!table) throw new Error('Missing Turing model results');
    const data = JSON.parse(table.replace(/([{,])(\w+):/g, '$1"$2":'));
    if (data.length < 8) throw new Error('Expected eight configurations');
    return data.map((r: Record<string, string>) => {
      const name = r.model.match(/^(.*) \(([^()]+)\)$/);
      const rate = r.passRate.match(/^([\d.]+)% ±([\d.]+)$/);
      const metrics = { steps: Number(r.steps), toolCalls: Number(r.toolCalls), latency: Number(r.wallMin) * 60 };
      const cost = Number(r.costPerTrial.replace('$', ''));
      if (!name || !rate || !Number.isFinite(cost) || !Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid ML and DS result');
      const score = Number(rate[1]), se = Number(rate[2]);
      return { model: name[1], setting: name[2], score, low: score - se, high: score + se, trials: 3, harness: 'Terminus-2', cost, metrics };
    });
  },
};
export default board;
