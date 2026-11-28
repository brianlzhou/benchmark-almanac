// Moonshot's official release page publishes the Kimi Claw 24/7 whole-benchmark pass rate.
// This is the agentic table, not Kimi Code Bench or other coding benchmarks.
// The linked methodology specifies 17 scenarios, 610 points, OpenClaw, and three runs. The release also lists K2.7 Code API rates and model size.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const FEED = 'https://www.kimi.ai/resources/kimi-k2-7-code';
const board: Leaderboard = {
  benchmark: 'kimi-claw-24-7-bench', url: FEED, feed: FEED,
  terms: 'Public Moonshot AI release-page results. Benchmark Almanac credits Moonshot AI and links the source.',
  stats: {
    priceCachedIn: { name: 'Cached input price', unit: 'usd-per-mtok', better: 'lower' },
    priceIn: { name: 'Input price', unit: 'usd-per-mtok', better: 'lower' },
    priceOut: { name: 'Output price', unit: 'usd-per-mtok', better: 'lower' },
    contextWindow: { name: 'Context window', unit: 'tokens', better: 'higher' },
    activeParams: { name: 'Active parameters', unit: 'billions' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    const all = tables(await fetchText(FEED));
    const pricing = all.find(t => t[0]?.some(c => c.text === 'Input Price (Cache Hit)'));
    const spec = all.find(t => t[0]?.[0]?.text === 'Parameter');
    const size = spec?.find(r => r[0].text === 'Total Parameters')?.[1]?.text;
    const active = spec?.find(r => r[0].text === 'Activated Parameters')?.[1]?.text;
    for (const t of all) {
      const scores = t.find(r => r[0]?.text === 'Kimi Claw 24/7 Bench');
      if (!scores) continue;
      for (let i = 1; i < scores.length; i++) {
        const model = t[0]?.[i]?.text, score = num(scores[i].text);
        const price = pricing?.find(r => r[0].text === model?.toLowerCase().replaceAll(' ', '-'));
        const metrics: Record<string, number> = {};
        let params: number | undefined;
        if (price?.[1]?.text === '1M tokens') {
          ['priceCachedIn', 'priceIn', 'priceOut', 'contextWindow'].forEach((key, j) => {
            const value = num(price[j + 2]?.text);
            if (value !== undefined) metrics[key] = value;
          });
        }
        if (model === 'Kimi K2.7 Code') {
          if (size && /^[\d.]+[TB]$/.test(size)) params = num(size)! * (size.endsWith('T') ? 1000 : 1);
          if (active && /^[\d.]+B$/.test(active)) metrics.activeParams = num(active)!;
        }
        if (model && score !== undefined) rows.push({model, score, trials: 3, params, metrics, harness: 'OpenClaw', setting: 'average pass rate over 610 evaluation points; mean of 3 runs'});
      }
    }
    if (!rows.length) throw new Error('Kimi Claw 24/7 table missing');
    return rows;
  },
};
export default board;
