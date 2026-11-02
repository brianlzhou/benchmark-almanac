// ScienceQA on scienceqa.github.io/leaderboard.html. The table is filled from javascript/leaderboard-data.js,
// which assigns one array literal, `leaderboard = [...]`: per entry the model, method, learning setting,
// date (YY-MM-DD) and accuracy by subject, context and grade, with Avg (0 to 100) the score. The array is
// read as data with jsLiteral, never run. The human and random-chance rows are skipped. Many entries are
// fine-tuned research systems, which stay unmatched unless the registry has them.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = 'https://scienceqa.github.io/javascript/leaderboard-data.js';

interface Entry {
  Model?: string;
  Method?: string;
  Date?: string;
  Avg?: string;
}

const board: Leaderboard = {
  benchmark: 'scienceqa',
  url: 'https://scienceqa.github.io/leaderboard.html',
  feed: FEED,
  terms: 'Static script on a GitHub Pages project site with no robots.txt and no terms; the ScienceQA data is CC BY-NC-SA 4.0 and the scores are cited to the authors.',
  aliases: {},
  async fetch() {
    const js = await fetchText(FEED);
    const at = js.indexOf('leaderboard = [');
    if (at < 0) throw new Error('leaderboard array not found');
    const rows: LeaderboardRow[] = [];
    for (const e of jsLiteral<Entry[]>(js, js.indexOf('[', at))) {
      const model = e.Model?.trim();
      const score = Number(e.Avg);
      if (!model || !Number.isFinite(score) || /^(Human|Random)/i.test(model)) continue;
      const d = e.Date?.match(/^(\d\d)-(\d\d)-(\d\d)$/);
      rows.push({ model, score, harness: e.Method && e.Method !== '-' ? e.Method : undefined, date: d ? `20${d[1]}-${d[2]}-${d[3]}` : undefined });
    }
    if (!rows.length) throw new Error('no rows in the ScienceQA leaderboard data');
    return rows;
  },
};
export default board;
