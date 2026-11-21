// RealWorkDecision measures whether models can predict business decisions from a frozen company's full context.
// The headline score is the default pass-rate percentage shown in the benchmark's embedded leaderboard.
// This importer reads the benchmark data object embedded in micro1's public page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const PAGE = 'https://www.micro1.ai/benchmark/real-work-decision';
const board: Leaderboard = {
  benchmark: 'realworkdecision-micro1',
  url: PAGE,
  feed: `${PAGE} (embedded real-world-decision-bench data)`,
  terms: 'micro1 publishes the public results page and its robots.txt allows it. The page gives no separate score-reuse license.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const marker = 'window.benchmarks_data["real-world-decision-bench"] =';
    const at = html.indexOf(marker);
    if (at < 0) throw new Error('RealWorkDecision embedded data missing');
    const data = jsonAt<{ lastUpdated?: string; defaultTab?: string; tabs?: Array<{ id: string; label: string; rows?: Array<{ name?: string; score?: number }> }> }>(html, html.indexOf('{', at));
    const tab = data.tabs?.find((entry) => entry.id === data.defaultTab) ?? data.tabs?.[0];
    if (!tab?.rows || tab.rows.length < 10) throw new Error('RealWorkDecision pass-rate rows missing');
    return tab.rows.map((row) => {
      if (!row.name || typeof row.score !== 'number' || !Number.isFinite(row.score)) throw new Error('RealWorkDecision row is incomplete');
      return { model: row.name, score: row.score, date: '2026-10-22' };
    });
  },
};
export default board;
