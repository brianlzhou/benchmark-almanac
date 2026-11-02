// AndroidLab. The leaderboard is a public Google Sheet maintained by the AndroidLab authors; its CSV export
// (export?format=csv&gid=0) starts with a title row, then Release Date, Model, Result Source, Model Size,
// Screen Representation and Success Rate (pass@1, 0 to 100). Success Rate is the score and the screen
// representation (Screenshot, XML, both) is passed as the setting, since the same model is listed under
// each. Fine-tuned rows ("(ft)") and agent products stay unmatched.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const SHEET = 'https://docs.google.com/spreadsheets/d/1Zv6mBfd4Ibt8mke24K6zAFrXe4AvEFaBLW3hpJqSgjw';
const FEED = `${SHEET}/export?format=csv&gid=0`;

const board: Leaderboard = {
  benchmark: 'androidlab',
  url: `${SHEET}/edit?gid=0#gid=0`,
  feed: `${FEED} (Success Rate)`,
  terms: 'Public Google Sheet published by the AndroidLab authors; docs.google.com robots.txt allows /spreadsheet paths, and the CSV export is the sheet\'s own download.',
  aliases: {
    'GPT-4o-2024-11-20': 'gpt-4o-nov-2024',
    // the AndroidLab paper (October 2024) ran Gemini 1.5 Pro 002
    'Gemini-1.5-Pro': 'gemini-1-5-pro-sept-2024',
  },
  async fetch() {
    const csv = await fetchText(FEED);
    const start = csv.indexOf('Release Date');
    if (start < 0) throw new Error('AndroidLab header row not found');
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(csv.slice(start))) {
      const key = (k: string) => Object.keys(r).find((h) => h.replace(/\s+/g, ' ').trim().startsWith(k)) ?? k;
      const model = r.Model?.trim();
      const score = num(r[key('Success Rate')]);
      if (!model || score === undefined) continue;
      rows.push({ model, score, setting: r[key('Screen')]?.trim().toLowerCase() || undefined });
    }
    return rows;
  },
};
export default board;
