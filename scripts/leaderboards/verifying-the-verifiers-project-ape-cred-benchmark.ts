// Verifying the Verifiers (Project APE CRED benchmark). The report at ape.socialcatalystlab.org/verify is a
// Next.js page whose figures carry their data in the page's flight payload. Figure 4 ("Single-error detection
// recall by model release date", the capability sample) lists every tested verifier configuration: the
// model id, harness, run date, pooled single-error detection recall (n=200) and list-price cost per paper.
// That recall, the report's headline measure (Codex 5.6 Sol high reached 99%), is the score, as a percent.
// The effort is the last word of the configuration label ("Codex 5.6 Sol high"); run dates are passed on.
// The recall's 95% interval (recall_ci) is kept as its half-width in percentage points, metrics "ci".
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';

const PAGE = 'https://ape.socialcatalystlab.org/verify';

interface Point {
  label: string;
  model?: string;
  harness?: string | null;
  run_date?: string;
  recall?: number;
  recall_ci?: [number, number] | null;
  cost_usd?: number;
}

const EFFORT: Record<string, string> = { low: 'low', med: 'medium', high: 'high', xhigh: 'xhigh' };

const board: Leaderboard = {
  benchmark: 'verifying-the-verifiers-project-ape-cred-benchmark',
  url: PAGE,
  feed: `${PAGE} (Next.js flight data, figure 4 points: single-error detection recall)`,
  terms: 'Public report page; ape.socialcatalystlab.org robots.txt allows all paths and the site states no terms.',
  aliases: {
    'mistral-small-3.2-24b-instruct': 'mistral-small-3-2',
    // Mistral's dated API id for Mistral Large 3
    'mistral-large-2512': 'mistral-large-3',
  },
  async fetch() {
    const flight = nextFlight(await fetchText(PAGE));
    const at = flight.indexOf('ape-verify-fig4-singleerror');
    if (at < 0) throw new Error('figure 4 data not found');
    const points = jsonAfter<Point[]>(flight.slice(at), '"points":');
    const rows: LeaderboardRow[] = [];
    for (const p of points) {
      if (!p.model || typeof p.recall !== 'number') continue;
      const effort = EFFORT[p.label.trim().split(/\s+/).at(-1)?.toLowerCase() ?? ''];
      rows.push({
        model: p.model,
        score: Number((p.recall * 100).toFixed(2)),
        setting: effort,
        harness: p.harness ?? undefined,
        date: p.run_date,
        cost: p.cost_usd,
        ...(Array.isArray(p.recall_ci) && p.recall_ci.length === 2 && p.recall_ci.every(Number.isFinite)
          ? { metrics: { ci: ((p.recall_ci[1] - p.recall_ci[0]) / 2) * 100 } }
          : {}),
      });
    }
    return rows;
  },
};
export default board;
