// AISHELL-4 tests transcription of Mandarin meetings. SOTA2 ranks speaker-attributed systems by character error rate after speaker matching.
// Read percentage-scale results that SOTA2 attributes to the method's own paper. The MOSS technical report uses fractions.
import type { Leaderboard } from './types.ts';
import { nextFlight, jsonAt } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://www.sota2.com/research/sota/speaker-attributed-automatic-speech-recognition-on-aishell-4-test';
interface Entry {
  methodName: string; reportPaperId: string; methodOriginPaperId: string; primaryMetricValue: number;
  inferenceConfig: Record<string, string> | null; metricValues: Record<string, number | null>;
}
const board: Leaderboard = {
  benchmark: 'aishell-4', host: 'SOTA2 Research', url: feed, feed,
  terms: 'SOTA2 Research publishes and credits the originating papers on its public benchmark page. ' + feed,
  stats: {
    CER: { name: 'Character error rate', unit: '%', better: 'lower' },
    'Delta cpCER': { name: 'Delta cpCER', unit: '%', better: 'lower', note: 'Difference between cpCER and CER.' },
    DER: { name: 'Diarization error rate', unit: '%', better: 'lower' },
    tcpCER: { name: 'tcpCER', unit: '%', better: 'lower', note: 'Character error rate with time-constrained speaker assignment.' },
  },
  async fetch() {
    const data = nextFlight(await fetchText(feed));
    const start = data.indexOf('"results":{"benchmarkId"');
    if (start < 0) throw new Error('Missing AISHELL-4 board data');
    const result = jsonAt<{primaryMetricKey: string; rows: Entry[]}>(data, start + '"results":'.length);
    if (result.primaryMetricKey !== 'cpCER' || !Array.isArray(result.rows)) throw new Error('Missing AISHELL-4 cpCER ranking');
    const rows = result.rows.filter(r => r.methodOriginPaperId === r.reportPaperId && ['69d33df27d0172140ec7361c', '69eeed6055a3c32af89f95db'].includes(r.reportPaperId));
    return checked(rows.map(r => {
      if (r.metricValues.cpCER !== r.primaryMetricValue) throw new Error('Inconsistent cpCER for ' + r.methodName);
      const metrics = Object.fromEntries(Object.entries(r.metricValues).filter((pair): pair is [string, number] => pair[0] !== 'cpCER' && Number.isFinite(pair[1])));
      return { model: r.methodName, setting: Object.entries(r.inferenceConfig ?? {}).map(([k, v]) => k + ': ' + v).join(', '), score: r.primaryMetricValue, metrics };
    }), 13);
  },
};
export default board;
