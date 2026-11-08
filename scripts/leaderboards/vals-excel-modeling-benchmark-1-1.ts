// Tokens / Test combines input and output; retain it as totalTokensPerTest, not output-only tokens.
// Vals Excel Modeling Benchmark v1.1 (not comparable with v1.0, says Vals) on vals.ai, read through the helper in vals-index.ts.
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'emb-v1-1';

const board: Leaderboard = {
  benchmark: 'vals-excel-modeling-benchmark-1-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  chart: VALS_LATENCY_CHART,
  async fetch() {
    const rows = await valsRows(SLUG);
    await new Promise(resolve=>setTimeout(resolve,1000));
    const t = tables(await fetchText(valsPage(SLUG))).find(t=>t[0]?.some(c=>c.text==='Tokens / Test'));
    if (!t) throw new Error('Tokens per test table missing');
    const h=t[0].map(c=>c.text), model=h.indexOf('Model'), token=h.indexOf('Tokens / Test');
    for (const r of t.slice(1)) {
      const row=rows.find(row=>row.model===r[model]?.text); if(!row)continue;
      const value=r[token]?.text.trim() ?? '';const n=num(value);
      if(n!==undefined) row.metrics={...row.metrics,totalTokensPerTest:n*(/m$/i.test(value)?1e6:/k$/i.test(value)?1e3:1)};
    }
    return rows;
  },
};
export default board;
