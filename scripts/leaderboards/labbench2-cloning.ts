// LABBench2 CloningQA asks models to answer molecular biology questions with
// optional tools. The Edison leaderboard is an HTML table with one row per
// model, variant and input mode, so this importer keeps those settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://advances.edisonscientific.com/benchmarks/labbench2/cloning/';
const rowPattern = /<tr[^>]*data-mode="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/gi;
const cells = (html: string) => [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

const board: Leaderboard = {
  benchmark: 'labbench2-cloning',
  url: PAGE,
  feed: PAGE,
  terms: 'Edison publishes this leaderboard without an explicit score reuse license.',
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  async fetch() {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];
    for (const match of html.matchAll(rowPattern)) {
      const c = cells(match[2]);
      const score = Number(c[4]) * 100;
      if (!c[1] || !Number.isFinite(score)) continue;
      rows.push({ model: c[1], setting: c[2] === '—' ? undefined : c[2], harness: c[3] === '—' ? undefined : c[3], score, date: c[7], tokens: Number.parseFloat(c[5].replace(/k$/i, '')) * (/[k]$/i.test(c[5]) ? 1000 : 1), metrics: { latency: Number.parseFloat(c[6]) * (/[m]$/i.test(c[6]) ? 60 : 1) } });
    }
    if (rows.length < 5) throw new Error(`LABBench2 CloningQA: ${rows.length} rows, expected at least 5`);
    return rows;
  },
};

export default board;
