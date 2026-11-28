// BulletBench (Spring Prompt): real-time chess under strict wall-clock time controls (Lightning 10+1, Bullet 60s, Blitz 3+2).
// Reads the server-rendered `<table class="board">` at https://springprompt.com/benchmarks/bulletbench (robots.txt Allow: /).
// Source verbatim CI header: "Lightning 10+1 · 95% range" (ladder Elo 95% confidence range wired to row.low / row.high).
// Live page draws "Lightning: strength against cost" (and thinking time) scatter charts.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://springprompt.com/benchmarks/bulletbench';

const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
const parseNum = (s: string): number | undefined => {
  const clean = s.replace(/[,$%s]/g, '').trim();
  if (!clean || clean === '–' || clean === '-' || clean === '—') return undefined;
  const n = Number(clean);
  return Number.isFinite(n) ? n : undefined;
};

function parseScoreAndRange(td: string): { score: number; low?: number; high?: number } | null {
  const txt = stripTags(td);
  const range = txt.match(/^([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s*[–-]\s*([\d,]+(?:\.\d+)?)/);
  if (range) {
    return {
      score: Number(range[1].replace(/,/g, '')),
      low: Number(range[2].replace(/,/g, '')),
      high: Number(range[3].replace(/,/g, '')),
    };
  }
  const single = txt.match(/^([\d,]+(?:\.\d+)?)/);
  return single ? { score: Number(single[1].replace(/,/g, '')) } : null;
}

function parseModelName(td: string): string {
  const aMatch = td.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
  return aMatch ? stripTags(aMatch[1]) : stripTags(td);
}

const board: Leaderboard = {
  benchmark: 'springprompt-bulletbench',
  url: PAGE,
  feed: PAGE,
  terms: 'Public server-rendered leaderboard at springprompt.com/benchmarks/bulletbench (robots.txt Allow: /).',
  chart: {
    title: 'Lightning: strength against cost',
    x: { key: 'cost', label: 'Cost per game', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Lightning 10+1 ladder Elo', better: 'higher' },
    note: 'Lightning 10+1 ladder Elo against US dollar cost per game across 45 models.',
  },
  parts: {
    bullet60s: { name: 'Bullet 60s', group: 'Time control' },
    blitz3plus2: { name: 'Blitz 3+2', group: 'Time control' },
  },
  stats: {
    moveTime: { name: 'Move time', unit: 'seconds', better: 'lower' },
    lostOnTime: { name: 'Lost on time', unit: '%', better: 'lower' },
    slowest10Pct: { name: 'Slowest 10% of moves (p90)', unit: 'seconds', better: 'lower' },
    games: { name: 'Games at this clock', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`BulletBench page: ${res.status}`);
    const html = await res.text();
    const tbodyMatch = html.match(/<table[^>]*class="board"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) throw new Error('BulletBench: leaderboard tbody not found');

    const rows: LeaderboardRow[] = [];
    for (const tr of tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      if (tds.length < 8) continue;
      const model = parseModelName(tds[1]);
      const parsed = parseScoreAndRange(tds[2]);
      if (!model || !parsed) continue;

      const metrics: Record<string, number> = {};
      const bullet = parseNum(stripTags(tds[3]));
      const blitz = parseNum(stripTags(tds[4]));
      const moveTime = parseNum(stripTags(tds[5]));
      const lost = parseNum(stripTags(tds[6]));
      const cost = parseNum(stripTags(tds[7]));
      const slow = tds[8] ? parseNum(stripTags(tds[8])) : undefined;
      const games = tds[9] ? parseNum(stripTags(tds[9])) : undefined;

      if (bullet !== undefined) metrics.bullet60s = bullet;
      if (blitz !== undefined) metrics.blitz3plus2 = blitz;
      if (moveTime !== undefined) metrics.moveTime = moveTime;
      if (lost !== undefined) metrics.lostOnTime = lost;
      if (slow !== undefined) metrics.slowest10Pct = slow;
      if (games !== undefined) metrics.games = games;

      const row: LeaderboardRow = { model, score: parsed.score, metrics };
      if (parsed.low !== undefined && parsed.high !== undefined) {
        row.low = parsed.low;
        row.high = parsed.high;
      }
      if (cost !== undefined) row.cost = cost;
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('BulletBench: parsed zero rows');
    return rows;
  },
};

export default board;
