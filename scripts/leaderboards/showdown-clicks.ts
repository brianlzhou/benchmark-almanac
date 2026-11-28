// Showdown Clicks (General Agents): offline macOS desktop UI left-click grounding accuracy and latency.
// Reads `const modelData = [...]` and `const latencyData = [...]` from https://generalagents.com/ace/.
// Source verbatim CI axis label: "Click Accuracy (95% CI)" with asymmetric ciMinus / ciPlus bounds wired to row.low / row.high.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://generalagents.com/ace/';

interface ClickEntry {
  model: string;
  accuracy: number;
  ciPlus?: number;
  ciMinus?: number;
}

interface LatencyEntry {
  model: string;
  latency: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function parseJsArray<T>(src: string, varName: string): T[] {
  const m = src.match(new RegExp(`const\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!m) throw new Error(`Showdown Clicks: ${varName} array not found`);
  const jsonLike = m[1]
    .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
    .replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(jsonLike) as T[];
}

const board: Leaderboard = {
  benchmark: 'showdown-clicks',
  url: PAGE,
  feed: PAGE,
  terms: 'Public benchmark results on generalagents.com/ace/ (open Showdown Clicks dataset at github.com/generalagents/showdown).',
  static: 'paper',
  harnesses: 'system',
  stats: {
    latencyMs: { name: 'Mean click latency', unit: 'ms', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`Showdown Clicks page: ${res.status}`);
    const html = await res.text();

    const accList = parseJsArray<ClickEntry>(html, 'modelData');
    const latList = parseJsArray<LatencyEntry>(html, 'latencyData');
    const latByModel = new Map(latList.map((e) => [e.model, e.latency]));

    const rows: LeaderboardRow[] = [];
    for (const e of accList) {
      if (!e.model || typeof e.accuracy !== 'number') continue;
      const plusMatch = e.model.match(/^(.+?)\s*\+\s*(.+)$/);
      const row: LeaderboardRow = {
        model: plusMatch ? plusMatch[2].trim() : e.model,
        score: r2(e.accuracy),
      };
      if (plusMatch) row.harness = plusMatch[1].trim();
      if (typeof e.ciMinus === 'number' && typeof e.ciPlus === 'number') {
        row.low = r2(e.accuracy - e.ciMinus);
        row.high = r2(e.accuracy + e.ciPlus);
      }
      const lat = latByModel.get(e.model);
      if (typeof lat === 'number' && Number.isFinite(lat)) {
        row.metrics = { latencyMs: lat };
      }
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('Showdown Clicks: parsed zero rows');
    return rows;
  },
};

export default board;
