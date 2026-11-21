// TaxCalcBench v2 (Column Tax), Tax Year 2025 edition: 50 returns from realistic PDF inputs, federal plus
// California, Illinois, New York and Virginia returns. Read from the same taxcalcbench.ai data file as the
// v1 board. The detailed TY25 table gives accuracy, cost, runtime and coverage for every thinking level.
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { TCB_ALIASES, TCB_FEED, TCB_PAGE, TCB_TERMS } from './taxcalcbench.ts';

const DETAILS = 'https://raw.githubusercontent.com/column-tax/tax-calc-bench/main/README.md';
interface Summary {
  modelId: string;
  base: string;
  strict: number;
  lenient: number;
  byLine: number;
  byLineLenient: number;
  webSearch: boolean;
  cost: number | null;
  time: number | null;
}

const board: Leaderboard = {
  benchmark: 'taxcalcbench-2',
  stats: { runtime: { name: 'Runtime', unit: 'seconds', better: 'lower' }, time: { name: 'Runtime including web search', unit: 'seconds', better: 'lower' } },
  url: TCB_PAGE,
  feed: `${TCB_FEED} (edition v2, strict)`,
  terms: TCB_TERMS,
  aliases: TCB_ALIASES,
  async fetch() {
    const data = jsonAfter<{ years: { edition: string; rows: Summary[] }[] }>(await fetchText(TCB_FEED), 'window.TCB_DATA =');
    const summary = data.years.find(year => year.edition === 'v2')?.rows;
    if (!summary?.length) throw new Error('TaxCalcBench v2 summary missing');
    const text = await fetchText(DETAILS);
    const section = text.split(/^## Detailed TY25 results\s*$/m)[1]?.split(/^## /m)[0] ?? '';
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      const [id, effort, tool, tests, strict, lenient, byLine, byLineLenient, cost, runtime] = line.trim().split('|').slice(1, -1).map(cell => cell.trim());
      const counts = tests?.match(/^(\d+)×(\d+)\/(\d+)$/);
      if (!counts || !strict?.endsWith('%')) continue;
      const model = summary.find(row => row.modelId === id)?.base ?? id;
      const metrics: Record<string, number> = { cases: Number(counts[1]), totalCases: Number(counts[3]) };
      for (const [key, cell] of Object.entries({ lenient, byLine, byLineLenient, runtime, time: runtime })) {
        if (Number.isFinite(parseFloat(cell))) metrics[key] = parseFloat(cell);
      }
      rows.push({ model, score: parseFloat(strict), trials: Number(counts[2]), metrics,
        setting: [effort, tool === 'web-search' ? 'web search' : tool].filter(Boolean).join(', '),
        cost: cost.startsWith('$') ? Number(cost.slice(1)) : undefined });
    }
    // Keep summary results that have no equivalent detailed row, including older models.
    for (const r of summary) {
      if (typeof r.strict !== 'number' || rows.some(row => row.model === r.base && row.score === r.strict &&
          !!row.setting?.includes('web search') === r.webSearch && row.metrics?.byLine === r.byLine &&
          row.metrics?.lenient === r.lenient && row.metrics?.byLineLenient === r.byLineLenient &&
          (row.cost ?? null) === r.cost && (row.metrics?.runtime ?? null) === r.time)) continue;
      rows.push({ model: r.base, score: r.strict, trials: 1, setting: r.webSearch ? 'web search' : undefined,
        cost: r.cost ?? undefined, metrics: { lenient: r.lenient, byLine: r.byLine, byLineLenient: r.byLineLenient,
          ...(r.time == null ? {} : { runtime: r.time, time: r.time }) } });
    }
    return rows;
  },
};
export default board;
