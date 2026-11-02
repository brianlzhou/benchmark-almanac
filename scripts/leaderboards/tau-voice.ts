// τ-Voice, shown on taubench.com as the "τ³-Voice" tab. The site reads the same public S3 bucket as the
// text boards: manifest.json lists the voice runs under "voice_submissions", and the tab's default
// Overall is the mean pass^1 of retail, airline and telecom (a row needs all three). Custom-scaffold runs,
// including those with a non-standard user simulator, are hidden by default on the site and left out
// here, as in the text boards. The reader lives in tau2-bench.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ALIASES, TERMS, loadTau, overall, row } from './tau2-bench.ts';

// loadTau is typed for the text keys, but voice runs sit in the same manifest with the same layout
const VOICE = 'voice_submissions' as 'submissions';

const board: Leaderboard = {
  benchmark: 'tau-voice',
  url: 'https://taubench.com/leaderboard?benchmark=voice',
  feed: 'https://sierra-tau-bench-public.s3.us-west-2.amazonaws.com/submissions/manifest.json (voice_submissions)',
  terms: TERMS,
  aliases: ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const s of await loadTau(VOICE)) {
      const score = overall(s);
      if (score !== null) rows.push(row(s, score));
    }
    return rows;
  },
};
export default board;
