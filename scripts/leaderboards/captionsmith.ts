// CaptionSmith tests timed ASR transcript conversion into valid SRT subtitles.
// BENCHMARKS.md publishes calibration mean rewards across five tasks with three rollouts each,
// plus parse rate and all four reward components (coverage, timing, constraints and segmentation).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/theSatvik/captionsmith/main/BENCHMARKS.md';
const board: Leaderboard = {
  benchmark: 'captionsmith',
  url: 'https://github.com/theSatvik/captionsmith',
  feed: FEED,
  terms: 'The repository is licensed under MIT. https://github.com/theSatvik/captionsmith',
  parts: {
    coverage: { name: 'Coverage', unit: 'score', group: 'Reward component' },
    timing: { name: 'Timing', unit: 'score', group: 'Reward component' },
    constraints: { name: 'Constraints', unit: 'score', group: 'Reward component' },
    segmentation: { name: 'Segmentation', unit: 'score', group: 'Reward component' },
  },
  stats: {
    parseRate: { name: 'Parse rate', unit: 'score', better: 'higher', note: 'Fraction of valid SRT outputs from 0 to 1.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const md = await fetchText(FEED);
    const table = markdownTables(md).find((t) => t[0].includes('Reward') && t[0].includes('Coverage') && t[0].includes('Segmentation'));
    if (!table) throw new Error('CaptionSmith calibration table missing');
    const links = new Map(
      [...md.matchAll(/- \[([^\]]+)\]\((https:\/\/app\.primeintellect\.ai\/dashboard\/evaluations\/[^)]+)\)/g)].map((m) => [m[1].toLowerCase(), m[2]]),
    );
    const rows: LeaderboardRow[] = [];
    for (const r of table.slice(1)) {
      const [rawModel, endpoint, budget, reward, parseRate, coverage, timing, constraints, segmentation] = r;
      const vals = [reward, parseRate, coverage, timing, constraints, segmentation].map(Number);
      if (!rawModel || vals.some((v) => !Number.isFinite(v))) continue;
      const quant = rawModel.match(/\s+(Q\d+_[A-Z_]+)$/);
      const model = quant ? rawModel.slice(0, quant.index).trim() : rawModel.trim();
      const settingParts = [endpoint?.trim(), quant?.[1], budget?.trim() ? `${budget.trim()} token budget` : undefined].filter(Boolean);
      const link = links.get(model.toLowerCase()) ?? [...links.entries()].find(([k]) => model.toLowerCase().startsWith(k))?.[1];
      rows.push({
        model,
        score: vals[0],
        trials: 3,
        setting: settingParts.join(', ') || undefined,
        link,
        metrics: {
          parseRate: vals[1],
          coverage: vals[2],
          timing: vals[3],
          constraints: vals[4],
          segmentation: vals[5],
        },
      });
    }
    return checked(rows, 3);
  },
};
export default board;
