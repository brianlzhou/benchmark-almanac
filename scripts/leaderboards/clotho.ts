// Clotho tests how well models describe audio recordings. SOTA2 ranks captioners by CIDEr.
// Its metrics are multiplied by 100. Divide by 100 to recover the original score scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { nextFlight, jsonAt } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/audio-captioning-on-clotho';
type Entry = { methodName:string, methodOriginPaperId:string|null, reportPaperId:string,
  primaryMetricValue:number|null, metricValues:Record<string,number|null>, inferenceConfig:Record<string,unknown>|null };
const board: Leaderboard = {
  benchmark: 'clotho', host:'SOTA2 Research', url:feed, feed,
  terms:'SOTA2 credits each result to its reporting paper on the public board. ' + feed,
  stats: {
    METEOR: { name: 'METEOR', unit: 'score', better: 'higher' },
    SPICE: { name: 'SPICE', unit: 'score', better: 'higher' },
    SPIDEr: { name: 'SPIDEr', unit: 'score', better: 'higher' },
    FENSE: { name: 'FENSE', unit: 'score', better: 'higher' },
    'BLEU-1': { name: 'BLEU-1', unit: 'score', better: 'higher' },
    'BLEU-2': { name: 'BLEU-2', unit: 'score', better: 'higher' },
    'BLEU-3': { name: 'BLEU-3', unit: 'score', better: 'higher' },
    'BLEU-4': { name: 'BLEU-4', unit: 'score', better: 'higher' },
    'ROUGE-L': { name: 'ROUGE-L', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const flight = nextFlight(await fetchText(feed));
    const start = flight.indexOf('"results":{"benchmarkId"');
    if (start < 0) throw new Error('Missing Clotho board');
    const table = jsonAt<{primaryMetricKey:string, rows:Entry[], total:number, metrics:{name:string,unit:string}[]}>(flight,start + '"results":'.length);
    if (table.primaryMetricKey !== 'CIDEr' || table.total !== table.rows.length || table.metrics.some(m=>m.unit !== 'PERCENT')) throw new Error('Changed Clotho scoring table');
    const rows = new Map<string,LeaderboardRow>();
    for (const r of table.rows) {
      if (!r.methodOriginPaperId || r.methodOriginPaperId !== r.reportPaperId || r.primaryMetricValue === null) continue;
      if (!Number.isFinite(r.primaryMetricValue) || r.primaryMetricValue !== r.metricValues.CIDEr) throw new Error('Invalid CIDEr score');
      const model = r.methodName.replace(/^M2D-CLAP stage/, 'M2D-CLAP2025 stage');
      const setting = Object.entries(r.inferenceConfig ?? {}).map(([k,v])=>k.replaceAll('_',' ') + ': ' + v).join(', ') || undefined;
      const metrics: Record<string,number> = {};
      for (const [k,v] of Object.entries(r.metricValues)) if (v !== null && k !== 'CIDEr') metrics[k] = v/100;
      const row = { model, setting, score:r.primaryMetricValue/100, metrics };
      const key = JSON.stringify([model,setting]);
      if (rows.has(key) && JSON.stringify(rows.get(key)) !== JSON.stringify(row)) throw new Error('Conflicting duplicate: ' + key);
      rows.set(key,row);
    }
    return checked([...rows.values()],21);
  },
};
export default board;
