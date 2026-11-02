// PinchBench 2.0 on pinchbench.com. The leaderboard is a server-rendered Next.js page whose flight data
// holds the board's "entries": per model (an OpenRouter-style slug such as "anthropic/claude-opus-4.8") the
// best run, the average over all official submissions, cost and run time. The page's default sort and its
// "Best Overall" pick use the average (average_score_percentage, a fraction), so that is the score here.
// average_cost_usd is the cost of one full run of every task, not of one task, so it is not kept. The page
// takes ?version=<semver>, and pinchbench.ts reads the last v1 release through pinchRows from this file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';

export const pinchPage = (version: string) => `https://pinchbench.com/?version=${version}`;
export const PINCH_TERMS =
  'Server-rendered public page; robots.txt allows all paths for every agent with a search=yes, ai-train=no content signal, and the site publishes no terms (the harness repository pinchbench/skill is MIT).';

interface Entry {
  model?: string;
  average_score_percentage?: number | null;
  timestamp?: string;
}

export async function pinchRows(version: string): Promise<LeaderboardRow[]> {
  const flight = nextFlight(await fetchText(pinchPage(version)));
  const shown = flight.match(/"currentVersion":"([^"]*)"/)?.[1];
  if (shown && shown !== version) throw new Error(`PinchBench served version ${shown}, not ${version}`);
  const entries = jsonAfter<Entry[]>(flight, '"entries":');
  const rows: LeaderboardRow[] = [];
  for (const e of entries) {
    if (!e.model || typeof e.average_score_percentage !== 'number') continue;
    // "anthropic/claude-opus-4.8": the provider prefix is dropped, the resolver reads the rest
    rows.push({
      model: e.model.replace(/^[^/]+\//, ''),
      score: e.average_score_percentage * 100,
      harness: 'OpenClaw',
      date: e.timestamp?.slice(0, 10),
    });
  }
  if (!rows.length) throw new Error(`no entries on the PinchBench ${version} board`);
  return rows;
}

const VERSION = '2.0.0';

const board: Leaderboard = {
  benchmark: 'pinchbench-2',
  url: 'https://pinchbench.com/',
  feed: `${pinchPage(VERSION)} (Next.js flight data, "entries")`,
  terms: PINCH_TERMS,
  aliases: {},
  fetch: () => pinchRows(VERSION),
};
export default board;
