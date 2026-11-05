// PinchBench 2.0 on pinchbench.com. The leaderboard is a server-rendered Next.js page whose flight data
// holds the board's "entries": per model (an OpenRouter-style slug such as "anthropic/claude-opus-4.8") the
// best run, the average over all official submissions, cost and run time. The page's default sort and its
// "Best Overall" pick use the average (average_score_percentage, a fraction), so that is the score here.
// average_cost_usd is the cost of one full run of every task, not of one task, so the 2.0 board keeps it with
// costPer 'run', and keeps average_execution_time_seconds as "time" (seconds per run): the page's "Success Rate
// vs. Execution Time" scatter plots the two averages. The page takes ?version=<semver>, and pinchbench.ts reads
// the last v1 release through pinchRows from this file (without the cost and time, unless it opts in).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';

export const pinchPage = (version: string) => `https://pinchbench.com/?version=${version}`;
export const PINCH_TERMS =
  'Server-rendered public page; robots.txt allows all paths for every agent with a search=yes, ai-train=no content signal, and the site publishes no terms (the harness repository pinchbench/skill is MIT).';

interface Entry {
  model?: string;
  average_score_percentage?: number | null;
  /** US dollars for one full run, averaged over the model's official submissions. */
  average_cost_usd?: number | null;
  average_execution_time_seconds?: number | null;
  timestamp?: string;
}

const positive = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/** `extras` adds the average run cost (`cost`, per run) and the average run time (`metrics.time`, seconds). */
export async function pinchRows(version: string, extras = false): Promise<LeaderboardRow[]> {
  const flight = nextFlight(await fetchText(pinchPage(version)));
  const shown = flight.match(/"currentVersion":"([^"]*)"/)?.[1];
  if (shown && shown !== version) throw new Error(`PinchBench served version ${shown}, not ${version}`);
  const entries = jsonAfter<Entry[]>(flight, '"entries":');
  const rows: LeaderboardRow[] = [];
  for (const e of entries) {
    if (!e.model || typeof e.average_score_percentage !== 'number') continue;
    // "anthropic/claude-opus-4.8": the provider prefix is dropped, the resolver reads the rest
    let model = e.model.replace(/^[^/]+\//, '');
    // "claude-opus-4.8-fast": Anthropic's fast output mode of the same model
    const fast = /^claude-.*-fast$/.test(model);
    if (fast) model = model.replace(/-fast$/, '');
    rows.push({
      model,
      score: e.average_score_percentage * 100,
      setting: fast ? 'fast mode' : undefined,
      harness: 'OpenClaw',
      date: e.timestamp?.slice(0, 10),
      ...(extras
        ? {
            cost: positive(e.average_cost_usd) ? e.average_cost_usd : undefined,
            metrics: positive(e.average_execution_time_seconds) ? { time: e.average_execution_time_seconds } : undefined,
          }
        : {}),
    });
  }
  if (!rows.length) throw new Error(`no entries on the PinchBench ${version} board`);
  return rows;
}

/** OpenRouter slugs the shared resolver cannot place. Both PinchBench importers use these. */
export const PINCH_ALIASES: Record<string, string> = {
  // Mistral's YYMM release tags: Small 4 came out in March 2026 and Large 3 in December 2025
  'mistral-small-2603': 'mistral-small-4',
  'mistral-large-2512': 'mistral-large-3',
  'gemma-4-26b-a4b-it': 'gemma-4-26b-a4b',
  'nemotron-3-super-120b-a12b': 'nemotron-3-super',
  'nemotron-3-ultra-550b-a55b': 'nemotron-3-ultra',
  // the full-precision weights (the 24 GB quantized run stays unmatched)
  'nemotron-3.5-bolt-74b-a9b-bf16': 'nemotron-3-5-bolt-74b-a9b',
  'nova-2-lite-v1': 'nova-2-lite',
  'llama-3.1-70b-instruct': 'llama-3-1-70b',
};

const VERSION = '2.0.0';

const board: Leaderboard = {
  benchmark: 'pinchbench-2',
  url: 'https://pinchbench.com/',
  feed: `${pinchPage(VERSION)} (Next.js flight data, "entries")`,
  terms: PINCH_TERMS,
  aliases: PINCH_ALIASES,
  costPer: 'run',
  chart: {
    title: 'Success Rate vs. Execution Time',
    note: 'Each point is one model: its average score against its average execution time for a full run, over its official submissions.',
    x: { key: 'time', label: 'Execution time per run', unit: 's', better: 'lower', log: true },
    y: { key: 'score', label: 'Success rate', unit: '%', better: 'higher' },
  },
  fetch: () => pinchRows(VERSION, true),
};
export default board;
