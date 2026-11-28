// ROASBench (Spring Prompt): 12-month simulated paid-marketing budget allocation benchmark.
// Reads `<table class="board">` at https://springprompt.com/benchmarks/roasbench (robots.txt Allow: /).
// Live page draws "Score against the cost of a run" scatter chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://springprompt.com/benchmarks/roasbench';

const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
const parseSignedNum = (s: string): number | undefined => {
  const txt = stripTags(s).replace(/−/g, '-').replace(/[,$]/g, '').trim();
  if (!txt || txt === '–' || txt === '-' || txt === '—') return undefined;
  const n = Number(txt);
  return Number.isFinite(n) ? n : undefined;
};
const parseModelName = (td: string): string => {
  const aMatch = td.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
  return aMatch ? stripTags(aMatch[1]) : stripTags(td);
};

const board: Leaderboard = {
  benchmark: 'springprompt-roasbench',
  url: PAGE,
  feed: PAGE,
  terms: 'Public server-rendered leaderboard at springprompt.com/benchmarks/roasbench (robots.txt Allow: /).',
  costPer: 'run',
  chart: {
    title: 'Score against the cost of a run',
    x: { key: 'cost', label: 'Cost of a run', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Overall score', better: 'higher' },
    note: 'Marketing performance score out of 100 over a 12-month simulation against API cost per run.',
  },
  stats: {
    profit: { name: 'Simulated profit', unit: 'usd', better: 'higher' },
    profitPerDollar: { name: 'Profit per $1 spent', unit: 'usd', better: 'higher' },
    monthsOverBudget: { name: 'Months over budget', unit: 'count', better: 'lower', note: 'Months out of 12 exceeding budget.' },
    monthsLosingMoney: { name: 'Months losing money', unit: 'count', better: 'lower', note: 'Months out of 12 with negative return.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`ROASBench page: ${res.status}`);
    const html = await res.text();
    const tbodyMatch = html.match(/<table[^>]*class="board"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) throw new Error('ROASBench: leaderboard tbody not found');

    const rows: LeaderboardRow[] = [];
    for (const tr of tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      if (tds.length < 8) continue;
      const model = parseModelName(tds[1]);
      const score = parseSignedNum(tds[2]);
      if (!model || score === undefined) continue;

      const metrics: Record<string, number> = {};
      const profit = parseSignedNum(tds[3]);
      const ppd = parseSignedNum(tds[4]);
      const over = parseSignedNum(tds[5]);
      const cost = parseSignedNum(tds[6]);
      const losing = parseSignedNum(tds[7]);

      if (profit !== undefined) metrics.profit = profit;
      if (ppd !== undefined) metrics.profitPerDollar = ppd;
      if (over !== undefined) metrics.monthsOverBudget = over;
      if (losing !== undefined) metrics.monthsLosingMoney = losing;

      const row: LeaderboardRow = { model, score, metrics };
      if (cost !== undefined) row.cost = cost;
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('ROASBench: parsed zero rows');
    return rows;
  },
};

export default board;
