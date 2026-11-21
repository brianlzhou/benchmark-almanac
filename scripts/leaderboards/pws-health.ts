// PWS-Health tests search engines on 133 private healthcare questions with verified answers.
// The headline score is accuracy as a percentage. The feed also reports cost per 1,000 questions.
// It reads the machine-readable Markdown version of Parallel's healthcare announcement.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://parallel.ai/blog/parallel-for-healthcare';
const FEED = 'https://parallel.ai/blog/parallel-for-healthcare.md';
const TERMS = 'Public Parallel announcement. The PWS-Health questions and answers are private and are not redistributed. Results are credited to Parallel.';

interface Point { label: string; x: number; y: number }

function readPoints(markdown: string): Point[] {
  const heading = '### PWS-Health (Parallel for Healthcare, Nov 2026)';
  const start = markdown.indexOf(heading);
  const end = markdown.indexOf('\n### ', start + heading.length);
  if (start < 0 || end < 0) throw new Error('PWS-Health: score section missing');
  const section = markdown.slice(start, end);
  const points = [...section.matchAll(/\{"label": "([^"]+)", "x": ([0-9.]+), "y": ([0-9.]+)\}/g)].map((match) => ({
    label: match[1],
    x: Number(match[2]),
    y: Number(match[3]),
  }));
  if (points.length !== 6 || points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    throw new Error(`PWS-Health: expected six score points, got ${points.length}`);
  }
  return points;
}

const board: Leaderboard = {
  benchmark: 'pws-health',
  url: URL,
  feed: FEED,
  terms: TERMS,
  chart: {
    title: 'Accuracy versus cost',
    x: { key: 'costPer1000', label: 'Cost per 1,000 questions', unit: 'usd', better: 'lower' },
    y: { key: 'score', label: 'Accuracy', unit: '%', better: 'higher' },
  },
  fetch: async (): Promise<LeaderboardRow[]> => readPoints(await fetchText(FEED)).map((point) => ({
    model: point.label,
    score: point.y,
    setting: 'Claude Opus 5.5 high effort answer model',
    cost: point.x / 1000,
    metrics: { costPer1000: point.x, accuracy: point.y, correctPerDollar: point.y / (point.x / 1000) },
  })),
};

export default board;
