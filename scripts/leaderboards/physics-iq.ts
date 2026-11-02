// Physics-IQ (Google DeepMind), original version. The makers keep the leaderboards as markdown tables in the
// google-deepmind/physics-IQ-benchmark README. This importer reads "Physics-IQ Original Leaderboard": per
// entry the model (often with a best-of-N reranker or prompt method after a "+"), the input type and the
// Physics-IQ score (0 to 100), which is the score. The model is the name before the first "+", the method
// after it becomes the harness, and the input type ("multiframe (v2v)", "i2v") becomes the setting. Entries
// arrive as pull requests from model makers, and the date added is the row date. Physics-IQ Verified, the
// table above it, is its own record.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { ghRaw, mdRecords, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'google-deepmind/physics-IQ-benchmark';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'physics-iq',
  url: `https://github.com/${REPO}#leaderboard`,
  feed: `${FEED} (Physics-IQ Original Leaderboard, Physics-IQ score)`,
  terms: 'README table in the google-deepmind/physics-IQ-benchmark GitHub repository; the code is Apache-2.0 and the scores are cited to the Physics-IQ authors.',
  aliases: {},
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => /Physics-IQ Original Leaderboard/.test(x.heading));
    if (!t) throw new Error('Physics-IQ Original table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of mdRecords(t)) {
      const score = num(r['Physics-IQ score']);
      const entry = (r.Model ?? '').replace(/\s+reported here\s*$/i, '').trim();
      if (!entry || score === undefined) continue;
      const [model, ...method] = entry.split(/\s+\+\s+/);
      const date = r['date added (YYYY-MM-DD)'];
      rows.push({
        model: model.trim(),
        score,
        harness: method.join(' + ') || undefined,
        setting: r['input type'] || undefined,
        date: /^\d{4}-\d\d-\d\d$/.test(date) ? date : undefined,
      });
    }
    return rows;
  },
};
export default board;
