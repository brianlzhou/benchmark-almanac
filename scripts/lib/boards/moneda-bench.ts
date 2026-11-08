// Moneda's own component benchmarks only, from its CC BY 4.0 score API. Other publishers' boards
// in the same API are excluded. Each component keeps the first/default metric shown on its page.
// AdviceBench currently means EU paired requests, and PortfolioBench means the 150 portfolio
// tasks; their other planned parts have no combined result. Catalog descriptions state this scope.
// Secondary metrics attach to the same model, setting and source date. Costs are USD per test item.
// Experimental results retain a verification setting and sourceUnranked diagnostic. Numa 1 has no
// underlying-model alias: these are product results. The row type has no source ranking-status flag.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';

const FEED = 'https://benchmarks.finance/api/scores.json';
const METRICS = {
  advicebench: ['EU paired pass rate %', 'EU personal directive rate %', 'personalDirectiveRate'],
  citebench: ['Factual share of linked claims %'],
  filingsbench: ['% correct (private split)'],
  groundbench: ['Correct rate %', 'Incorrect rate %', 'incorrectRate'],
  portfoliobench: ['Portfolio tasks, % correct'],
} as const;
type Component = keyof typeof METRICS;
interface Result {
  benchmark: string; model: string; modelSlug: string; score: number; metric: string;
  higherIsBetter: boolean; setting: string; source: { date: string | null };
  reportedBy: string; costPerTest: number | null; unranked: boolean;
  ciLow: number | null; ciHigh: number | null;
}
interface Feed { licence: { name: string }; attribution: string; results: Result[] }

export function monedaBoard(component: Component): Leaderboard {
  const metric: readonly string[] = METRICS[component];
  return {
    benchmark: `moneda-bench-${component}`,
    url: `https://benchmarks.finance/benchmarks/moneda-${component}/`,
    feed: FEED,
    terms: 'The score API is CC BY 4.0 and requests attribution to benchmarks.finance by Moneda.',
    async fetch(): Promise<LeaderboardRow[]> {
      const data = await fetchJson<Feed>(FEED);
      if (data.licence?.name !== 'CC BY 4.0' || !Array.isArray(data.results)) throw new Error('Moneda score API schema or license changed');
      const source = data.results.filter(r => r.benchmark === `moneda-${component}` && r.reportedBy === 'Run by Moneda');
      const primary = source.filter(r => r.metric === metric[0]);
      if (!primary.length) throw new Error(`Moneda ${component} default metric missing`);
      const seen = new Set<string>();
      return primary.map(r => {
        if (!r.model || !Number.isFinite(r.score) || r.score < 0 || r.score > 100 || r.higherIsBetter !== true) throw new Error(`Moneda ${component} invalid score or direction`);
        const id = `${r.modelSlug}|${r.setting}|${r.source.date}`;
        if (seen.has(id)) throw new Error(`Moneda ${component} duplicate run`);
        seen.add(id);
        const metrics: Record<string, number> = {};
        for (const key of ['ciLow', 'ciHigh'] as const) if (r[key] != null && Number.isFinite(r[key])) metrics[key] = r[key];
        if (metric.length > 1) {
          const secondary = source.filter(s => s.metric === metric[1] && s.modelSlug === r.modelSlug && s.setting === r.setting && s.source.date === r.source.date);
          if (secondary.length > 1) throw new Error(`Moneda ${component} duplicate secondary metric`);
          if (secondary[0] && Number.isFinite(secondary[0].score)) metrics[metric[2]] = secondary[0].score;
        }
        if (r.unranked) metrics.sourceUnranked = 1;
        const experimental = /experimental/i.test(r.setting);
        if (experimental) metrics.experimental = 1;
        const setting = experimental ? 'experimental' : undefined;
        if (r.costPerTest != null && (!Number.isFinite(r.costPerTest) || r.costPerTest < 0)) throw new Error('Moneda invalid per-item cost');
        return {
          model: r.model, score: r.score, setting,
          date: r.source.date && /^\d{4}-\d{2}-\d{2}$/.test(r.source.date) ? r.source.date : undefined,
          cost: r.costPerTest ?? undefined, metrics,
        };
      });
    },
  };
}
