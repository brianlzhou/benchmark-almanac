// ATLAS (OpenCompass). The test-set board is a sleeping Space that reads results from private OSS storage,
// so this reads the board the authors keep in the GitHub README instead: "Leaderboard Highlights", a
// Markdown table (Rank | Model | Organization | Accuracy (Avg)) of public validation-set results judged by
// OpenAI o4-mini. Accuracy (Avg) is the score. "OpenAI GPT-5-High" drops the maker's name, and the trailing
// effort becomes the setting through the resolver.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/open-compass/ATLAS/main/README.md';

const board: Leaderboard = {
  benchmark: 'atlas-opencompass',
  url: 'https://github.com/open-compass/ATLAS#-leaderboard-highlights',
  feed: `${FEED} (Leaderboard Highlights table, Accuracy (Avg), validation set)`,
  terms: 'README of the public open-compass/ATLAS GitHub repository, read through raw.githubusercontent.com; the repository states no license.',
  aliases: {
    'DeepSeek-R1-0528': 'deepseek-r1-may-2025',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const md = await fetchText(FEED);
    const start = md.indexOf('Leaderboard Highlights');
    if (start < 0) throw new Error('Leaderboard Highlights section not found');
    const lines = md.slice(start).split('\n');
    const head = lines.findIndex((l) => /^\|\s*Rank\s*\|/.test(l));
    if (head < 0) throw new Error('leaderboard table not found');
    const cols = lines[head].split('|').map((c) => c.trim());
    const [iModel, iAcc] = [cols.indexOf('Model'), cols.findIndex((c) => /^Accuracy/.test(c))];
    const rows: LeaderboardRow[] = [];
    for (const l of lines.slice(head + 2)) {
      if (!l.startsWith('|')) break;
      const cells = l.split('|').map((c) => c.trim());
      const score = num(cells[iAcc]);
      const model = (cells[iModel] ?? '').replace(/^OpenAI\s+/, '');
      if (model && score !== undefined) rows.push({ model, score });
    }
    if (!rows.length) throw new Error('no ATLAS rows');
    return rows;
  },
};
export default board;
