// Kinetics-600 tests action recognition in video. SOTA2 ranks systems by top-1 accuracy.
// Read results cited to the model's own paper. Combine duplicate citations of the same configuration.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { nextFlight, jsonAt } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/video-action-recognition-on-kinetics-600';
interface Entry {
  methodName: string; primaryMetricValue: number; metricValues: Record<string, number | null>;
  reportPaperId: string; methodOriginPaperId: string; inferenceConfig: Record<string, string> | null;
}
const board: Leaderboard = {
  benchmark: 'kinetics-600', host: 'SOTA2 Research', url: feed, feed,
  terms: 'SOTA2 Research links each published result to its source paper at ' + feed,
  stats: {top5:{name:'Top-5 accuracy',unit:'%',better:'higher'}},
  async fetch() {
    const data = nextFlight(await fetchText(feed));
    const start = data.indexOf('"results":{"benchmarkId"');
    if (start < 0) throw new Error('Missing Kinetics-600 leaderboard');
    const table = jsonAt<{ primaryMetricKey: string; rows: Entry[]; total: number }>(data, start + '"results":'.length);
    if (table.primaryMetricKey !== 'Top-1 Acc' || table.rows.length !== table.total) throw new Error('Incomplete Kinetics-600 ranking');
    const entries = new Map<string, LeaderboardRow>();
    for (const r of table.rows) {
      if (!r.reportPaperId || r.methodOriginPaperId !== r.reportPaperId) continue;
      const score = r.metricValues['Top-1 Acc'];
      if (score === null || score !== r.primaryMetricValue) throw new Error('Missing Kinetics-600 top-1 accuracy');
      const config = { ...r.inferenceConfig };
      // Two entries cite the same EVA fine-tuning result with complementary labels.
      if (r.methodName === 'EVA' && score === 89.8 && r.reportPaperId === '68fa6e1b1e209131cea3dd3f') {
        config.protocol = 'fine-tuning';
        config['Pre-training Data'] = 'K-722 (merged K-400, K-600, K-700)';
      }
      const setting = Object.keys(config).sort().map(k => k + ': ' + config[k]).join(', ');
      const top5 = r.metricValues['Top-5 Acc'];
      const row = { model: r.methodName, score, setting: setting || undefined,
        link: 'https://www.sota2.com/research/paper/' + r.reportPaperId, metrics: top5 != null ? { top5 } : undefined };
      const key = JSON.stringify([row.model, row.setting]);
      if (entries.has(key) && JSON.stringify(entries.get(key)) !== JSON.stringify(row)) throw new Error('Conflicting Kinetics-600 rows');
      entries.set(key, row);
    }
    return checked([...entries.values()], 9);
  },
};
export default board;
