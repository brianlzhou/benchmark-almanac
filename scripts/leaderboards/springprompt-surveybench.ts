// SurveyBench (Spring Prompt): research survey design and evidence-grounded analysis across 9 tasks with traps.
// Reads `<table class="board">` at https://springprompt.com/benchmarks/surveybench (robots.txt Allow: /).
// Source verbatim CI header: "Analysis rating · 95% range" (95% confidence range wired to row.low / row.high).
// Live page draws "Analysis rating against cost" scatter chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://springprompt.com/benchmarks/surveybench';

const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
const firstNum = (s: string): number | undefined => {
  const m = stripTags(s).match(/^\$?([\d,]+(?:\.\d+)?)/);
  return m ? Number(m[1].replace(/,/g, '')) : undefined;
};
const parseModelName = (td: string): string => {
  const aMatch = td.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
  return aMatch ? stripTags(aMatch[1]) : stripTags(td);
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

const board: Leaderboard = {
  benchmark: 'springprompt-surveybench',
  url: PAGE,
  feed: PAGE,
  terms: 'Public server-rendered leaderboard at springprompt.com/benchmarks/surveybench (robots.txt Allow: /).',
  chart: {
    title: 'Analysis rating against cost',
    x: { key: 'cost', label: 'Cost per task', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Analysis rating', better: 'higher' },
    note: 'Pairwise analysis rating against US dollar cost per task across 28 models.',
  },
  stats: {
    researchScore: { name: 'Research score', unit: 'score', better: 'higher', note: 'Points out of 100.' },
    soundResearch: { name: 'Sound research', unit: '%', better: 'higher' },
    trapsHandled: { name: 'Traps handled', unit: '%', better: 'higher' },
    costPerSoundTask: { name: 'Cost per sound task', unit: 'usd', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`SurveyBench page: ${res.status}`);
    const html = await res.text();
    const tbodyMatch = html.match(/<table[^>]*class="board"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) throw new Error('SurveyBench: leaderboard tbody not found');

    const rows: LeaderboardRow[] = [];
    for (const tr of tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      if (tds.length < 7) continue;
      const model = parseModelName(tds[1]);
      const parsed = parseScoreAndRange(tds[2]);
      if (!model || !parsed) continue;

      const metrics: Record<string, number> = {};
      const rScore = firstNum(tds[3]);
      const sound = firstNum(tds[4]);
      const traps = firstNum(tds[5]);
      const cost = firstNum(tds[6]);
      const costSound = tds[7] ? firstNum(tds[7]) : undefined;

      if (rScore !== undefined) metrics.researchScore = rScore;
      if (sound !== undefined) metrics.soundResearch = sound;
      if (traps !== undefined) metrics.trapsHandled = traps;
      if (costSound !== undefined) metrics.costPerSoundTask = costSound;

      const row: LeaderboardRow = { model, score: parsed.score, metrics };
      if (parsed.low !== undefined && parsed.high !== undefined) {
        row.low = parsed.low;
        row.high = parsed.high;
      }
      if (cost !== undefined) row.cost = cost;
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('SurveyBench: parsed zero rows');
    return rows;
  },
};

export default board;
