// Construction's Last Exam evaluates geometric takeoff on construction plans.
// Togal's ranking table uses the overall takeoff score and gives estimated full-suite costs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { jsLiteral } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://cle.togal.ai/overview.html";

const board: Leaderboard = {
  benchmark: "constructions-last-exam",
  url: "https://cle.togal.ai/overview.html",
  feed,
  terms: "Togal gives no explicit score reuse license on the board. The embedded table has estimated API costs. https://cle.togal.ai/overview.html The site serves no robots.txt.",
  costPer: 'run',
  parts: { wall: 'Linear', area: 'Areas', imageSearch: 'Counting' },
  async fetch() {
    const html = await fetchText(feed);
    const marker = html.match(/const ROWS\s*=\s*(?=\[)/);
    if (!marker || !html.includes('const SORT_KEY = "takeoff"')) throw new Error('Missing takeoff ranking data');
    type Entry = { model: string; costUsd: number | null; ours?: boolean; scores: Record<string,number> };
    const entries = jsLiteral<Entry[]>(html, marker.index! + marker[0].length);
    if (entries.filter(r => !r.ours).length < 31) throw new Error('Missing takeoff models');
    return entries.map(r => {
      const { takeoff, ...metrics } = r.scores;
      if (!r.model || !Number.isFinite(takeoff) || !Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid takeoff result');
      return { model: r.model, score: takeoff, setting: r.ours ? 'Human-assisted software' : undefined, cost: r.costUsd ?? undefined, metrics };
    });
  },
};

export default board;
