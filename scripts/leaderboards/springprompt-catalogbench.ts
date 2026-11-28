// CatalogBench (Spring Prompt): e-commerce product listing generation across 56 products and 3 runs.
// Reads `<table class="board">` at https://springprompt.com/benchmarks/catalogbench (robots.txt Allow: /).
// Live page draws "Publish-ready rate against cost" (log-scale Cost per 10,000 products vs publish-ready %).
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://springprompt.com/benchmarks/catalogbench';

const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
const parseNum = (s: string): number | undefined => {
  const clean = s.replace(/[,$%s]/g, '').trim();
  if (!clean || clean === '–' || clean === '-' || clean === '—') return undefined;
  const n = Number(clean);
  return Number.isFinite(n) ? n : undefined;
};
const parseModelName = (td: string): string => {
  const aMatch = td.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
  return aMatch ? stripTags(aMatch[1]) : stripTags(td);
};
const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

const board: Leaderboard = {
  benchmark: 'springprompt-catalogbench',
  url: PAGE,
  feed: PAGE,
  terms: 'Public server-rendered leaderboard at springprompt.com/benchmarks/catalogbench (robots.txt Allow: /).',
  chart: {
    title: 'Publish-ready rate against cost',
    x: { key: 'costPer10k', label: 'Cost per 10,000 products', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Reliably publish-ready', unit: '%', better: 'higher' },
    note: 'Share of 56 products reliably publish-ready on the factual brief against US dollar cost per 10,000 products.',
  },
  parts: {
    salesBrief: { name: 'Publish-ready, sales brief', group: 'Brief' },
  },
  stats: {
    costPer10k: { name: 'Cost per 10,000 products', unit: 'usd', better: 'lower' },
    costPer1kAccepted: { name: 'Cost per 1,000 accepted listings', unit: 'usd', better: 'lower' },
    unsupportedClaims: { name: 'Unsupported claims', unit: '%', better: 'lower' },
    claimsToCheck: { name: 'Claims to check', unit: '%', better: 'lower' },
    failedOutputs: { name: 'Failed outputs', unit: '%', better: 'lower' },
    responseTime: { name: 'Mean response time', unit: 'seconds', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`CatalogBench page: ${res.status}`);
    const html = await res.text();
    const tbodyMatch = html.match(/<table[^>]*class="board"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) throw new Error('CatalogBench: leaderboard tbody not found');

    const rows: LeaderboardRow[] = [];
    for (const tr of tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      if (tds.length < 9) continue;
      const model = parseModelName(tds[1]);
      const score = parseNum(stripTags(tds[2]));
      if (!model || score === undefined) continue;

      const metrics: Record<string, number> = {};
      const sales = parseNum(stripTags(tds[3]));
      const cost10k = parseNum(stripTags(tds[4]));
      const cost1kAcc = parseNum(stripTags(tds[5]));
      const unsupported = parseNum(stripTags(tds[6]));
      const toCheck = parseNum(stripTags(tds[7]));
      const failed = parseNum(stripTags(tds[8]));
      const resp = tds[10] ? parseNum(stripTags(tds[10])) : undefined;

      if (sales !== undefined) metrics.salesBrief = sales;
      if (cost10k !== undefined) metrics.costPer10k = cost10k;
      if (cost1kAcc !== undefined) metrics.costPer1kAccepted = cost1kAcc;
      if (unsupported !== undefined) metrics.unsupportedClaims = unsupported;
      if (toCheck !== undefined) metrics.claimsToCheck = toCheck;
      if (failed !== undefined) metrics.failedOutputs = failed;
      if (resp !== undefined) metrics.responseTime = resp;

      const row: LeaderboardRow = { model, score, trials: 3, metrics };
      if (cost10k !== undefined) row.cost = r6(cost10k / 10000);
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('CatalogBench: parsed zero rows');
    return rows;
  },
};

export default board;
