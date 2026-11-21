// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Construction's Last Exam v2 tests quantity takeoff, drawing reasoning and end-to-end estimating.
// The overview page embeds the leaderboard rows, including estimated API cost for the full suite.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://cle.togal.ai/v2/overview.html';
const parts = { takeoff: 'Geometric', reasoning: 'Reasoning', e2e: 'End-to-end', wall: 'Linear', area: 'Areas',
  imageSearch: 'Counting', legend: 'Legend', assembly: 'Assemblies', accuracy: 'Drawing QA', textSearch: 'Text search' };
type Entry = { model: string; ours?: boolean; costUsd: number | null; scores: Record<string, number | null> };
const board: Leaderboard = {
  benchmark: 'constructions-last-exam-2', url: feed, feed,
  terms: 'Togal.AI publishes the leaderboard. Source attribution and copyright apply. ' + feed,
  headline: 'Plain mean of the geometric, reasoning, and end-to-end track scores.',
  parts, costPer: 'run',
  async fetch() {
    const source = (await fetchText(feed)).match(/const ROWS\s*=\s*(\[[\s\S]*?\]);/);
    if (!source) throw new Error('Missing overview rows');
    const entries: Entry[] = JSON.parse(source[1].replace(/(\b[a-zA-Z]\w*)\s*:/g, '"$1":').replace(/,\s*([}\]])/g, '$1'));
    const rows = [];
    for (const entry of entries) {
      if (entry.ours) continue;
      const { takeoff, reasoning, e2e } = entry.scores;
      if (takeoff == null || reasoning == null || e2e == null) continue;
      const metrics: Record<string, number> = {};
      for (const [key, value] of Object.entries(entry.scores)) {
        if (value == null) continue;
        if (!(key in parts) || !Number.isFinite(value) || value < 0 || value > 100) throw new Error('Invalid track score');
        metrics[key] = value;
      }
      rows.push({ model: entry.model, score: (takeoff + reasoning + e2e) / 3, metrics, cost: entry.costUsd ?? undefined });
    }
    return checked(rows, 9);
  },
};
export default board;
