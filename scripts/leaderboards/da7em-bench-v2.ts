// Da7em Bench v2.0: independent private-task benchmark evaluating frontier models on real client work across 12
// professional axes grouped into Mind, Execution, Reliability, and Output pillars on a 0 to 10 scale. Reads the
// structured window.DA7_BENCH JSON embedded in the official English leaderboard page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://da7tech.com/da7em-bench/?lang=en';

interface Da7Payload {
  date?: string;
  models: {
    name: string;
    overall: number;
    pillars: Record<string, number>;
    scores: Record<string, number>;
  }[];
}

const PILLAR_KEYS = [
  ['Mind', 'mind'],
  ['Execution', 'execution'],
  ['Reliability', 'reliability'],
  ['Output', 'output'],
] as const;

const AXIS_KEYS = [
  'reasoning',
  'research',
  'planning',
  'delivery',
  'grit',
  'honesty',
  'discipline',
  'acceptance',
  'designing',
  'taste',
  'writing',
  'style',
] as const;

const board: Leaderboard = {
  benchmark: 'da7em-bench-v2',
  url: PAGE,
  feed: PAGE,
  terms: 'Published openly on da7tech.com. Robots.txt allows crawling of /da7em-bench/.',
  parts: {
    mind: { name: 'Mind', group: 'Pillar' },
    execution: { name: 'Execution', group: 'Pillar' },
    reliability: { name: 'Reliability', group: 'Pillar' },
    output: { name: 'Output', group: 'Pillar' },
    reasoning: { name: 'Reasoning and judgment', group: 'Axis' },
    research: { name: 'Research and exploration', group: 'Axis' },
    planning: { name: 'Planning', group: 'Axis' },
    delivery: { name: 'Delivery', group: 'Axis' },
    grit: { name: 'Determination to fix', group: 'Axis' },
    honesty: { name: 'Accuracy and context retention', group: 'Axis' },
    discipline: { name: 'Honesty and neutrality', group: 'Axis' },
    acceptance: { name: 'Acceptance vs refusal', group: 'Axis' },
    designing: { name: 'Engineering', group: 'Axis' },
    taste: { name: 'Taste', group: 'Axis' },
    writing: { name: 'Writing', group: 'Axis' },
    style: { name: 'Communication and style', group: 'Axis' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const m = html.match(/window\.DA7_BENCH\s*=\s*(\{[\s\S]*?\});/);
    if (!m) throw new Error('window.DA7_BENCH JSON payload not found');
    const data = JSON.parse(m[1]) as Da7Payload;
    const date = data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : undefined;
    const out: LeaderboardRow[] = data.models.map((entry) => {
      if (!Number.isFinite(entry.overall)) throw new Error(`Invalid overall score for ${entry.name}`);
      const metrics: Record<string, number> = {};
      for (const [src, dst] of PILLAR_KEYS) {
        const v = entry.pillars[src];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[dst] = v;
      }
      for (const k of AXIS_KEYS) {
        const v = entry.scores[k];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      return { model: entry.name, score: entry.overall, date, metrics };
    });
    if (out.length < 8) throw new Error(`Da7em Bench returned only ${out.length} rows`);
    return out;
  },
};
export default board;
