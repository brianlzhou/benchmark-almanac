// Parallel's Search Capability Leaderboard measures model performance with web search.
// The headline score is Search Intelligence, with the no-search score, lift, cost, and time kept as metrics.
// It reads the first Markdown table from Parallel's public leaderboard feed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://parallel.ai/leaderboard';
const FEED = 'https://parallel.ai/leaderboard.md';
const TERMS = 'Public Parallel leaderboard and methodology. No separate data reuse license is stated on the page. Results are credited to Parallel.';

function score(value: string): number {
  const n = Number(value.replace(/[$,+%s]/g, '').trim());
  if (!Number.isFinite(n)) throw new Error(`Parallel search leaderboard: invalid value ${value}`);
  return n;
}

function rowsFromMarkdown(markdown: string): LeaderboardRow[] {
  const start = markdown.indexOf('| Rank | Model');
  if (start < 0) throw new Error('Parallel search leaderboard: Search Intelligence table missing');
  const end = markdown.indexOf('\n## ', start);
  const table = markdown.slice(start, end < 0 ? markdown.length : end);
  const rows: LeaderboardRow[] = [];
  for (const line of table.split('\n').slice(2)) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 8) throw new Error(`Parallel search leaderboard: expected 8 cells, got ${cells.length}`);
    const model = cells[1].match(/^\[([^\]]+)\]/)?.[1];
    if (!model) throw new Error(`Parallel search leaderboard: invalid model cell ${cells[1]}`);
    const time = cells[7] === '—' ? undefined : score(cells[7]);
    rows.push({
      model,
      score: score(cells[3]),
      open: cells[2] === 'Open',
      cost: score(cells[6]),
      ...(time === undefined ? {} : { metrics: { latency: time } }),
      ...(time === undefined ? { metrics: {} } : {}),
    });
    const metrics = rows.at(-1)!.metrics!;
    metrics.withoutSearch = score(cells[4]);
    metrics.lift = score(cells[5]);
  }
  if (rows.length < 58) throw new Error(`Parallel search leaderboard: only ${rows.length} Search Intelligence rows`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'parallel-search-capability-leaderboard',
  url: URL,
  feed: FEED,
  terms: TERMS,
  chart: {
    title: 'Search Intelligence versus search lift',
    x: { key: 'lift', label: 'Lift from search', unit: 'score', better: 'higher' },
    y: { key: 'score', label: 'Score with search', unit: 'score', better: 'higher' },
  },
  fetch: async () => rowsFromMarkdown(await fetchText(FEED)),
};

export default board;
