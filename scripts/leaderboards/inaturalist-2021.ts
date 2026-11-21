// iNaturalist 2021 tests species classification in natural-world photographs.
// SOTA2 ranks models by top-1 accuracy and gives the architecture and evaluation protocol.
import type { Leaderboard } from './types.ts';
import { nextFlight, jsonAt } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/image-classification-on-inaturalist-2021';
type Entry = {methodName: string, primaryMetricValue: number, metricValues: Record<string, number>,
  inferenceConfig: Record<string, string | number>};
export default {
  benchmark: 'inaturalist-2021', host: 'SOTA2 Research', url: feed, feed,
  terms: 'SOTA2 credits the reporting papers at ' + feed,
  async fetch() {
    const data = nextFlight(await fetchText(feed));
    const start = data.indexOf('"results":{"benchmarkId"');
    if (start < 0) throw new Error('Missing iNaturalist results');
    const table = jsonAt<{primaryMetricKey: string, total: number, rows: Entry[]}>(data, start + '"results":'.length);
    if (table.primaryMetricKey !== 'Top-1 Accuracy' || table.rows.length !== table.total) throw new Error('Missing top-1 results');
    return checked(table.rows.map(row => {
      const score = row.metricValues['Top-1 Accuracy'];
      if (score !== row.primaryMetricValue || score < 0 || score > 100) throw new Error('Invalid accuracy');
      const {backbone, ...config} = row.inferenceConfig;
      const settings = Object.entries(config).filter(([,v]) => v !== '-').map(([k,v]) => k + ': ' + v);
      if (backbone) settings.unshift(row.methodName);
      return {model: String(backbone || row.methodName), score, setting: settings.join(', ') || undefined};
    }), 82);
  },
} satisfies Leaderboard;
