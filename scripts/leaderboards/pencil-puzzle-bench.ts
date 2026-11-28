// Pencil Puzzle Bench on ppbench.com. The page is server-rendered with one leaderboard table: # | Model |
// Direct Ask | Agentic | Cost/Agentic. The page ranks by the agentic success rate (0 to 100), which is the
// score, and Cost/Agentic is the cost of one puzzle. Model names carry the effort after "@"
// ("claude-fable-5@high"), which becomes the setting. Each strategy has its own row. Model pages supply attempts, time, cost and scores by puzzle type.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { PINCH_ALIASES } from './pinchbench-2.ts';

const URL = 'https://ppbench.com/';

const board: Leaderboard = {
  benchmark: 'pencil-puzzle-bench',
  url: URL,
  feed: `${URL} (leaderboard table, Agentic)`,
  terms: 'Server-rendered public page; robots.txt allows all paths for generic agents with a search=yes, ai-train=no content signal, and the site publishes no terms.',
  // OpenRouter-style slugs, shared with the PinchBench importers
  aliases: PINCH_ALIASES,
  stats: {
    attempts: { name: 'Attempts', unit: 'count' },
    latency: { name: 'Mean attempt duration', unit: 'seconds', better: 'lower' },
    averageTurns: { name: 'Mean turns per attempt', unit: 'count' },
    meanAttemptCost: { name: 'Mean attempt cost', unit: 'usd', better: 'lower' },
  },
  async fetch() {
    const html = await fetchText(URL);
    const table = tables(html).find(t => t[0]?.some(c => c.text === 'Agentic'));
    if (!table) throw new Error('Puzzle leaderboard missing');
    const rows: LeaderboardRow[] = [];
    const parts: NonNullable<Leaderboard['parts']> = {};
    for (const cells of table.slice(1)) {
      const anchor = cells[1]?.html.match(/<a\b[^>]*href="(model\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!anchor) continue;
      const [model, effort] = text(anchor[2]).split('@');
      const link = new globalThis.URL(anchor[1], URL).href;
      await new Promise(resolve => setTimeout(resolve, 1000));
      const detail = await fetchText(link);
      const attempts = [...detail.matchAll(/<tr\b([^>]*\bdata-strategy="[^"]+"[^>]*)>/g)].map(row =>
        Object.fromEntries([...row[1].matchAll(/data-([a-z]+)="([^"]*)"/g)].map(m => [m[1], m[2]])));
      for (const [strategy, column] of [['agentic', 3], ['direct', 2]] as const) {
        const score = num(cells[column]?.text);
        if (score === undefined) continue;
        const runs = attempts.filter(a => a.strategy === strategy && ['true', 'false'].includes(a.solved));
        const metrics: Record<string, number> = {};
        let cost = strategy === 'agentic' ? num(cells[4]?.text) : undefined;
        if (runs.length && Math.abs(100 * runs.filter(r => r.solved === 'true').length / runs.length - score) <= 0.051) {
          metrics.attempts = runs.length;
          for (const [attr, key] of [['duration', 'latency'], ['turns', 'averageTurns'], ['cost', 'meanAttemptCost']]) {
            if (runs.every(r => r[attr]?.trim() && Number.isFinite(Number(r[attr])))) {
              metrics[key] = runs.reduce((sum, r) => sum + Number(r[attr]), 0) / runs.length;
            }
          }
          cost ??= metrics.meanAttemptCost;
          for (const type of new Set(runs.map(r => r.type).filter(Boolean))) {
            const group = runs.filter(r => r.type === type);
            metrics[type] = 100 * group.filter(r => r.solved === 'true').length / group.length;
            parts[type] = { name: type, group: 'Puzzle type' };
          }
        }
        rows.push({ model, score, cost, link, metrics, setting: [effort, strategy === 'direct' ? 'Direct Ask' : 'Agentic'].filter(Boolean).join(', ') });
      }
    }
    board.parts = parts;
    return rows;
  },
};
export default board;
