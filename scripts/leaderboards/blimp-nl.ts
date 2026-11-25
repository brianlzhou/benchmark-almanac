// BLiMP-NL tests Dutch linguistic acceptability with minimal pairs.
// EuroEval publishes Dutch CoLA accuracy for each evaluated language model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://euroeval.com/leaderboards-csv/dutch_all_models.csv';
const board: Leaderboard = {
  benchmark: 'blimp-nl', host: 'EuroEval', url: 'https://euroeval.com/datasets/dutch', feed,
  terms: 'EuroEval publishes its leaderboard for public use. https://euroeval.com/',
  stats: {
    macroF1: { name: 'Macro F1', unit: '%', better: 'higher' },
    failedExamples: { name: 'Failed evaluations', unit: 'count', better: 'lower' },
  },
  async fetch() {
    const raw = await fetchText(feed);
    const csv = raw.slice(raw.indexOf('Rank,Model'));
    const rows = parseCsv(csv);
    const col = Object.keys(rows[0] ?? {}).find(key => key.includes('dutch_cola'));
    if (!col) throw new Error('Dutch CoLA column missing');
    const out: LeaderboardRow[] = [];
    for (const row of rows) {
      const model = row.Model?.replace(/<[^>]+>/g, '').trim();
      const [mccPart, f1Part] = (row[col] ?? '').split('/');
      const mccMatch = mccPart?.match(/(-?[0-9.]+)(?:\s*±\s*([0-9.]+))?/);
      if (!model || !mccMatch) continue;
      const score = Number(mccMatch[1]);
      const half = mccMatch[2] ? Number(mccMatch[2]) : undefined;
      const low = half !== undefined && Number.isFinite(half) && half > 0 ? Number((score - half).toFixed(2)) : undefined;
      const high = half !== undefined && Number.isFinite(half) && half > 0 ? Number((score + half).toFixed(2)) : undefined;
      const f1Val = f1Part?.match(/(-?[0-9.]+)/)?.[1];
      const failVal = row.dutch_cola_failures && /^\d+$/.test(row.dutch_cola_failures.trim()) ? Number(row.dutch_cola_failures.trim()) : undefined;
      const metrics: Record<string, number> = {};
      if (low !== undefined && high !== undefined) {
        metrics.ciLow = low;
        metrics.ciHigh = high;
      }
      if (f1Val !== undefined && Number.isFinite(Number(f1Val))) metrics.macroF1 = Number(f1Val);
      if (failVal !== undefined) metrics.failedExamples = failVal;
      const open = row.Open === '✓' ? true : undefined;
      const rawParams = row.Parameters ? Number(row.Parameters) : NaN;
      const params = Number.isFinite(rawParams) && rawParams > 0 ? Number((rawParams / 1e9).toFixed(3)) : undefined;
      out.push({
        model,
        score,
        setting: 'Dutch CoLA test split',
        ...(low !== undefined && high !== undefined ? { low, high } : {}),
        ...(open === undefined ? {} : { open }),
        ...(params !== undefined ? { params } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (out.length < 2) throw new Error('No Dutch CoLA model rows');
    return checked(out, out.length);
  },
};
export default board;
