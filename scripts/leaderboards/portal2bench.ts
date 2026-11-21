// Portal2Bench ranks agents by the number of chambers solved.
// The leaderboard page lists the harness, attempted chambers and separate full-game results.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://kingstonyip.com/portal2bench";

const board: Leaderboard = {
  benchmark: "portal2bench",
  url: "https://kingstonyip.com/portal2bench",
  feed,
  terms: "The maker's results page gives no reuse license. robots.txt allows the feed path.",
  async fetch() {
    const html = await fetchText(feed);
    if (!html.includes('Chambers solved')) throw new Error('Missing chambers solved column');
    const rows = [];
    for (const match of html.matchAll(/<div class="leaderboard-module[^"]*__r"[^>]*>([\s\S]*?)<\/div>/g)) {
      const line = text(match[1]);
      if (line.endsWith('–')) continue;
      const row = line.match(/^(.+?) (Codex|Claude Code|Antigravity) (\d+) \/ (\d+)(?: (\d+) \/ (\d+))?$/);
      if (!row) throw new Error('Unrecognized Portal2Bench row: ' + line);
      const metrics: Record<string, number> = { attempted: Number(row[4]) };
      if (row[5]) { metrics.fullGameSolved = Number(row[5]); metrics.fullGameAttempted = Number(row[6]); }
      const tie = match[0].match(/Breaks ties: ([\d.]+)\. A solve/);
      if (tie) metrics.tiebreak = Number(tie[1]);
      rows.push({ model: row[1], harness: row[2], setting: 'Max effort', score: Number(row[3]), metrics });
    }
    if (rows.length < 9) throw new Error('Missing scored agents');
    return rows;
  },
};
export default board;
