// Railhead tests model-controlled transport companies in an OpenTTD arena.
// The headline is net worth after the run-off year, in the source's score scale.
// The importer reads the Arena 2 scoreboard in the project README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/rachittshah/railhead/main/README.md';
const board: Leaderboard = {
  benchmark: 'railhead',
  url: 'https://github.com/rachittshah/railhead',
  feed: FEED,
  terms: 'Public repository results under the repository license. https://github.com/rachittshah/railhead',
  aliases: { 'gpt-6.1-sol': 'gpt-6-1-sol' },
  async fetch(): Promise<LeaderboardRow[]> {
    const s = await fetchText(FEED);
    const block = s.match(/\| Model \| Net worth after year 11[\s\S]*?\n\| No play \|[^\n]+/);
    if (!block) throw new Error('Railhead Arena 2 table missing');
    const rows: LeaderboardRow[] = [];
    for (const line of block[0].split('\n').slice(2)) {
      const m = line.match(/^\| ([^|]+) \| (?:£)?(-?£?[\d,]+)/);
      if (!m || /Scripted|No play/.test(m[1])) continue;
      rows.push({ model: m[1].trim(), score: Number(m[2].replace(/[£,]/g, '') ) });
    }
    return checked(rows, 11);
  },
};
export default board;
