// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// Foreverse compares twenty-round novel continuations. Its JSON gives two blind review positions per genre.
// The mean uses the four observed positions. Separate metrics retain the authors' unresolved consensus rank ranges.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://foreverse.app/research/fiction-bench/data.json';
type Genre = { rank: string; packs: string };
type Entry = { name: string; xuanhuan: Genre; courtRomance: Genre; pricing: {inUsdPerM: number; outUsdPerM: number; usdPer10kChars: number} };
const board: Leaderboard = {
  benchmark: 'fiction-bench-foreverse', url: 'https://foreverse.app/research/fiction-bench', feed,
  terms: 'CC BY 4.0, Foreverse Research. https://github.com/foreverseapp/webnovel-continuation-bench#benchmark-card',
  headline: 'Plain mean of four blind review ranks across two genres, lower is better.',
  parts: { p303: 'Xuanhuan p303', p404: 'Xuanhuan p404', p505: 'Court romance p505', p606: 'Court romance p606' },
  stats: { priceIn: { name: 'Input price', unit: 'usd-per-mtok', better: 'lower' }, priceOut: { name: 'Output price', unit: 'usd-per-mtok', better: 'lower' }, usdPer10kChars: { name: 'Price per 10,000 characters', unit: 'usd', better: 'lower' } },
  async fetch() {
    const input = await fetchJson<{models: Entry[]; testedAt: string}>(feed);
    return checked(input.models.map(m => {
      const metrics: Record<string, number> = { priceIn: m.pricing.inUsdPerM, priceOut: m.pricing.outUsdPerM,
        usdPer10kChars: m.pricing.usdPer10kChars };
      for (const genre of ['xuanhuan', 'courtRomance'] as const) {
        const ranks = m[genre].rank.match(/^(\d+)(?:-(\d+))?$/);
        const packs = [...m[genre].packs.matchAll(/\b(p\d+) #(\d+)\b/g)];
        const ids = genre === 'xuanhuan' ? 'p303,p404' : 'p505,p606';
        if (!ranks || packs.map(p => p[1]).join(',') !== ids) throw new Error('Missing blind ranks');
        metrics[genre + 'RankLow'] = Number(ranks[1]);
        metrics[genre + 'RankHigh'] = Number(ranks[2] ?? ranks[1]);
        for (const [, pack, position] of packs) metrics[pack] = Number(position);
      }
      return { model: m.name, date: input.testedAt, score: (metrics.p303 + metrics.p404 + metrics.p505 + metrics.p606) / 4, metrics };
    }), 9);
  },
};
export default board;
