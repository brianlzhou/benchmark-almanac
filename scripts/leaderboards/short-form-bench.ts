// Short Form Bench (naive). usenaive.ai/benchmark/short-form-bench is server-rendered with a leaderboard
// table of model, business value in US dollars (mean over seasons, "±" spread dropped), seasons and cost
// per season. Business value is the score (the board's unit, dollars). Read through naiveRows in
// clipping-bench.ts. The table's Cost / season, the LLM cost of one full season (one run of the benchmark,
// as on Clipping Bench), is read here from the same table and kept as `cost` (costPer 'run').
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { NAIVE_TERMS, naiveRows } from './clipping-bench.ts';

const URL = 'https://usenaive.ai/benchmark/short-form-bench';

const board: Leaderboard = {
  benchmark: 'short-form-bench',
  url: URL,
  feed: `${URL} (server-rendered table, business value)`,
  terms: NAIVE_TERMS,
  aliases: {},
  costPer: 'run',
  async fetch() {
    const rows = await naiveRows(URL);
    const t = tables(await fetchText(URL)).find((x) => x[0]?.some((c) => c.text === 'Cost / season'));
    if (t) {
      const head = t[0].map((c) => c.text);
      const [iModel, iCost] = [head.indexOf('Model'), head.indexOf('Cost / season')];
      // the model cell holds the name, then the maker
      const costs = t.slice(1).map((r) => [r[iModel]?.text ?? '', num(r[iCost]?.text)] as const);
      for (const r of rows) r.cost = costs.find(([cell]) => cell === r.model || cell.startsWith(`${r.model} `))?.[1];
    }
    return rows;
  },
};
export default board;
