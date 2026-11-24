// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// HUD tests computer, browser and tool use. The chart gives percentages for each capability.
// Two transcriptions of the chart agreed on all twelve labels. The image hash guards those values.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://hnsifoclvesgacxnjrto.supabase.co/storage/v1/object/public/cms-media/Screenshot%202026-07-29%20at%2004.30.57.png';
const digest = '57333ce314f419d4f2220a8c151ce99f3b7f0a22bc803b34f306a696b29c34e6';
const readings: [string, number, number, number][] = [
  ['OpenAI Operator', 45, 31, 28],
  ['Claude 3.5 Sonnet', 38, 27, 22],
  ['GPT-4 Turbo', 35, 25, 20],
  ['Gemini Ultra', 32, 23, 18],
];

const board: Leaderboard = {
  benchmark: 'autonomy-10-hud',
  url: 'https://www.hud.ai/blog/autonomy-10',
  feed,
  terms: 'HUD publishes the chart under its site terms. https://www.hud.ai/terms-of-service',
  aliases: { 'Gemini Ultra': 'gemini-1-0-ultra' },
  headline: 'The chart gives no overall score, so this is the plain mean of the three capability percentages.',
  parts: { skill: 'Skill', flexibility: 'Flexibility', intelligence: 'Intelligence' },
  async fetch() {
    const rows = readings.map(([model, skill, flexibility, intelligence]) => ({
      model, score: (skill + flexibility + intelligence) / 3, metrics: { skill, flexibility, intelligence },
    }));
    return checked(await chartRows(feed, digest, rows), 4);
  },
};
export default board;
