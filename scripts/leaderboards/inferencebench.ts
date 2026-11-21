// InferenceBench measures how much an agent improves LLM serving speed over a PyTorch baseline.
// The headline score is aggregate geometric-mean speedup, with four scenario speedups and uncertainty as metrics.
// This importer reads the leaderboardRows array from the public JavaScript feed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://inferencebench.ai/';
const FEED = 'https://inferencebench.ai/script.js?v=20261119-2';
const board: Leaderboard = {
  benchmark: 'inferencebench',
  stats: { prefill: { name: 'Prefill speedup', unit: 'speedup', better: 'higher' }, decode: { name: 'Decode speedup', unit: 'speedup', better: 'higher' }, throughput: { name: 'Throughput speedup', unit: 'speedup', better: 'higher' }, allInOne: { name: 'All-in-one speedup', unit: 'speedup', better: 'higher' }, sem: { name: 'Speedup standard error', unit: 'speedup', better: 'lower' } },
  url: `${PAGE}#leaderboard`,
  feed: FEED,
  terms: 'The public page and JavaScript feed publish the leaderboard. No separate score-reuse license is stated, and the site has no robots.txt.',
  harnesses: 'system',
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const marker = source.indexOf('const leaderboardRows =');
    if (marker < 0) throw new Error('InferenceBench leaderboardRows missing');
    const rows = jsLiteral<Array<{ model: string; scaffold?: string; value: number; sem?: number; a?: number; b?: number; c?: number; d?: number }>>(source, source.indexOf('[', marker));
    if (rows.length < 50) throw new Error(`InferenceBench: ${rows.length} rows, expected at least 50`);
    return rows.map((row) => {
      const label = row.model.trim();
      const settingMatch = label.match(/^(.*)\s+\(([^()]+)\)$/);
      const model = (settingMatch?.[1] ?? label).trim();
      const setting = [settingMatch?.[2], row.scaffold].filter(Boolean).join(', ');
      const metrics: Record<string, number> = {};
      for (const [key, value] of Object.entries({ prefill: row.a, decode: row.b, throughput: row.c, allInOne: row.d, sem: row.sem })) {
        if (typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
      }
      return { model, setting: setting || undefined, harness: row.scaffold?.split(' · ')[0], score: row.value, low: row.sem != null ? row.value - row.sem : undefined, high: row.sem != null ? row.value + row.sem : undefined, metrics };
    });
  },
};
export default board;
