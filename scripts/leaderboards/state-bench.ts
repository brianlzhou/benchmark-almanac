// STATE-Bench (Microsoft). The leaderboard page draws its tables from a JavaScript array, `const entries`,
// in leaderboard/leaderboard.js next to the page (read as data with jsLiteral, never run). Each entry has
// the track ("main" or "memory" for the Agent Learning Track), the model, its reasoning label, the
// benchmark version, the submission date and metrics: overall pass@1 (the page's headline, 0 to 100),
// pass^5, UX score and cost per task. The page lists each benchmark version separately and scores moved
// between versions, so only main-track entries on the newest version are read: overallPassAt1 is the
// score, the reasoning label the setting and costPerTask the cost.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://microsoft.github.io/STATE-Bench/leaderboard/';
const FEED = `${PAGE}leaderboard.js`;

interface Entry {
  track: string;
  model: string;
  reasoningLabel?: string | null;
  agent?: string | null;
  submissionDate?: string;
  benchmarkVersion: string;
  metrics: { overallPassAt1?: number; costPerTask?: number | null };
}

const version = (v: string) => v.split('.').map(Number);
const newer = (a: string, b: string) => {
  const [x, y] = [version(a), version(b)];
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  return false;
};

const board: Leaderboard = {
  benchmark: 'state-bench',
  url: PAGE,
  feed: `${FEED} (const entries: main track, newest benchmark version, overall pass@1)`,
  terms: 'Static script on the STATE-Bench GitHub Pages site that the leaderboard page loads; the STATE-Bench repository is MIT-licensed.',
  async fetch(): Promise<LeaderboardRow[]> {
    const js = (await fetchText(FEED)).replace(/:\s*undefined\b/g, ': null');
    const start = js.indexOf('[', js.indexOf('const entries'));
    if (start < 0) throw new Error('entries array not found');
    const main = jsLiteral<Entry[]>(js, start).filter((e) => e.track === 'main');
    const latest = main.reduce((v, e) => (newer(e.benchmarkVersion, v) ? e.benchmarkVersion : v), '0.0.0');
    const rows: LeaderboardRow[] = [];
    for (const e of main.filter((x) => x.benchmarkVersion === latest)) {
      const score = e.metrics.overallPassAt1;
      if (!e.model || typeof score !== 'number') continue;
      rows.push({
        model: e.model,
        score,
        setting: e.reasoningLabel && e.reasoningLabel !== 'default' ? e.reasoningLabel.toLowerCase() : undefined,
        harness: e.agent || undefined,
        date: e.submissionDate,
        cost: e.metrics.costPerTask ?? undefined,
      });
    }
    if (!rows.length) throw new Error(`no main-track entries for version ${latest}`);
    return rows;
  },
};
export default board;
