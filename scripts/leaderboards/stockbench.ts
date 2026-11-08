// StockBench. stockbench.github.io carries its leaderboard as a static HTML table: per model the final
// return over the trading window (%), maximum drawdown (%) and Sortino ratio. The page says:
// "Models are ranked based on the mean of all three metrics." Its published Rank is the score, lower is better.
// We read that ordinal directly and do not infer a normalization or recompute the composite.
// The passive buy-and-hold baseline is skipped. Final Return, Max Drawdown and Sortino remain secondary metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://stockbench.github.io/';

const board: Leaderboard = {
  benchmark: 'stockbench',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (static HTML table, Rank, lower is better)`,
  terms: 'Static project page on GitHub Pages (no robots.txt rules); the site states no terms.',
  aliases: {
    // the instruct-only and thinking-only Qwen3 checkpoints are the July 2025 (2507) releases
    'Qwen3-235B-Ins': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-235B-Think': 'qwen3-235b-a22b-thinking-jul-2025',
    'Qwen3-30B-Think': 'qwen3-30b-a3b-thinking-jul-2025',
    'Qwen3-Coder': 'qwen3-coder-480b-a35b',
    'OpenAI-O3': 'o3',
    'Claude-4-Sonnet': 'claude-sonnet-4',
  },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => /^Final Return/.test(c.text)));
    if (!t) throw new Error('leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const iModel = head.indexOf('Model');
    const iRank = head.indexOf('Rank');
    if (iRank < 0 || iModel < 0) throw new Error('StockBench Rank or Model column not found');
    const iRet = head.findIndex((h) => /^Final Return/.test(h));
    const iDd = head.findIndex((h) => /^Max Drawdown/.test(h));
    const iSortino = head.findIndex((h) => /^Sortino/.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[iModel]?.text;
      const score = num(r[iRank]?.text);
      if (!model || score === undefined || /baseline/i.test(model)) continue;
      const metrics: Record<string, number> = {};
      const ret = num(r[iRet]?.text);
      if (iRet >= 0 && ret !== undefined) metrics.finalReturn = ret;
      const [dd, sortino] = [num(r[iDd]?.text), num(r[iSortino]?.text)];
      if (iDd >= 0 && dd !== undefined) metrics.maxDrawdown = dd;
      if (iSortino >= 0 && sortino !== undefined) metrics.sortino = sortino;
      rows.push({ model, score, metrics: Object.keys(metrics).length ? metrics : undefined });
    }
    return rows;
  },
};
export default board;
