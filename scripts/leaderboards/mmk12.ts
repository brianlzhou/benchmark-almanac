// MMK12 is a manually collected multimodal mathematical reasoning benchmark with four scientific subjects.
// The score is the README's average accuracy across Mathematics, Physics, Chemistry and Biology.
// This importer reads the fixed results table in the dataset README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://huggingface.co/datasets/FanqingM/MMK12';
const FEED = 'https://huggingface.co/datasets/FanqingM/MMK12/raw/main/README.md';

const board: Leaderboard = {
  benchmark: 'mmk12',
  url: PAGE,
  feed: FEED,
  terms: 'The dataset repository publishes this results table under its repository license. Results are credited to the MMK12 authors.',
  static: 'paper',
  parts: { mathematics: { name: 'Mathematics', group: 'Subject' }, physics: { name: 'Physics', group: 'Subject' }, chemistry: { name: 'Chemistry', group: 'Subject' }, biology: { name: 'Biology', group: 'Subject' } },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const line of (await fetchText(FEED)).split('\n')) {
      const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/);
      if (!match || /^(Model|[-]+)$/.test(match[1].trim())) continue;
      const [, model, math, physics, chemistry, biology, avg] = match;
      rows.push({ model: model.trim(), score: Number(avg), metrics: { mathematics: Number(math), physics: Number(physics), chemistry: Number(chemistry), biology: Number(biology) } });
    }
    if (rows.length !== 18) throw new Error(`MMK12: ${rows.length} rows, expected 18`);
    return rows;
  },
};

export default board;
