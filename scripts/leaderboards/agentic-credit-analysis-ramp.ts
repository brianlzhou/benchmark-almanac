// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Ramp compares model accuracy when extracting credit metrics from analyst-reviewed financial statements.
// The article's chart data gives accuracy, precision and recall for each document type with and without Ramp's pipeline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://builders.ramp.com/post/credit-analysis-using-semantics';
const feed = 'https://builders.ramp.com/assets/index-DaCNdoGx.js';
const board: Leaderboard = {
  benchmark: 'agentic-credit-analysis-ramp', url, feed,
  terms: 'Ramp publishes the chart in its engineering article. https://ramp.com/terms-of-service',
  parts: { pnl: 'P&L', balanceSheet: 'Balance sheet' },
  harnesses: 'system',
  async fetch() {
    const bundle = await fetchText(feed);
    const table = bundle.match(/\[\{name:"[^"]+",pnl:\{alone:\{matchRate:[^\]]+\}\]/)?.[0];
    if (!table) throw new Error('Missing Ramp model comparison');
    const models = JSON.parse(table.replace(/([{,])(\w+):/g, '$1"$2":'));
    const rows: LeaderboardRow[] = [];
    for (const model of models) {
      for (const mode of ['alone', 'pipeline']) {
        const metrics: Record<string, number> = {};
        for (const part of ['pnl', 'balanceSheet']) {
          const { matchRate, precision, recall } = model[part][mode];
          if (![matchRate, precision, recall].every(v => Number.isFinite(v) && v >= 0 && v <= 100))
            throw new Error('Invalid Ramp document scores');
          metrics[part] = matchRate;
          metrics[part + 'Precision'] = precision;
          metrics[part + 'Recall'] = recall;
        }
        rows.push({ model: model.name, score: (metrics.pnl + metrics.balanceSheet) / 2, metrics,
          harness: mode === 'pipeline' ? 'Ramp pipeline' : undefined });
      }
    }
    return checked(rows, 14);
  },
};
export default board;
