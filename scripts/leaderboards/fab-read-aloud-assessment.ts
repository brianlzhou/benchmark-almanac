// Fab AI ranks read-aloud transcriptions by overall word error rate.
// The page embeds overall and exercise-level word and mistake error rates.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://www.fab-ai.org/benchmarks?benchmark=global&benchmarkType=asr-assessment&dataset=&modelMode=default&models=%5B%5D&pageView=table&price=10";
type Model = { displayName: string; size?: number; open: boolean; blended_price?: number };
type Result = { modelId: string; benchmark_domain: string; accuracy: number; categories: { value: string | null }[] };

const board: Leaderboard = {
  benchmark: "fab-read-aloud-assessment",
  url: "https://www.fab-ai.org/benchmarks?benchmark=global&benchmarkType=asr-assessment&dataset=&modelMode=default&models=%5B%5D&pageView=table&price=10",
  feed,
  terms: "Fab AI marks the leaderboard as all rights reserved. robots.txt allows the feed path.",
  stats: { pricePerMillion: { name: 'Price per million tokens', unit: 'usd', better: 'lower' }, global_WER: { name: 'Word error rate', unit: '%', better: 'lower' }, global_MER: { name: 'Mistake error rate', unit: '%', better: 'lower' } },
  async fetch() {
    const html = (await fetchText(feed)).replace(/("(?:[^"\\]|\\.)*")|([:,])(-?)\.(\d+)/g,
      (all, quoted, prefix, sign, digits) => quoted ?? prefix + sign + '0.' + digits);
    function field<T>(marker: string) {
      const i = html.indexOf(marker);
      if (i < 0) throw new Error('Missing Fab AI data: ' + marker);
      return jsLiteral<T>(html, i + marker.length);
    }
    const records = field<Result[]>('originalData:');
    const models: Record<string, Model> = {};
    for (const group of html.matchAll(/,models:(?=\{)/g)) Object.assign(models, jsLiteral(html, group.index + group[0].length));
    const domains = new Map([...html.matchAll(/\{id:"(\w+)",displayName:"([^"]+)"\}/g)].map(m => [m[1], m[2]]));
    const rows = records.filter(r => r.benchmark_domain === 'global' && r.categories[0]?.value === 'WER');
    if (rows.length < 22) throw new Error('Missing overall read-aloud results');
    return rows.map(r => {
      const m = models[r.modelId], metrics: Record<string, number> = {};
      if (!m?.displayName || !Number.isFinite(r.accuracy)) throw new Error('Invalid read-aloud score');
      if (m.blended_price != null) metrics.pricePerMillion = m.blended_price;
      for (const sub of records.filter(s => s.modelId === r.modelId)) {
        const measure = sub.categories[0]?.value;
        if (!measure) continue;
        const domain = sub.benchmark_domain;
        const key = domain + '_' + measure;
        metrics[key] = sub.accuracy;
        if (domain !== 'global') (board.parts ??= {})[key] = { name: domains.get(domain) ?? domain, group: measure, unit: '%', better: 'lower' };
      }
      return { model: m.displayName, score: r.accuracy, open: m.open, params: m.size ? m.size / 1e9 : undefined, metrics };
    });
  },
};
export default board;
