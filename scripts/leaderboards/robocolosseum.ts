// RoboColosseum compares robot policies in blind physical trials. The site opens on the Franka Open track.
// The leaderboard API reports a separate rating for each embodiment and task results for fine-tuned policies.
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';

const url = 'https://robocolosseum.ai/';
const feed = url + 'api/leaderboard?track=open';
type Rating = { track: string, robotId: string, policyId: string, revision: string, score: number | null,
  ratingCiLow: number | null, ratingCiHigh: number | null, std: number, evals: number, ratingMethod: string,
  wins: number, losses: number, ties: number };
type Fine = { robotId: string, policyId: string, successes: number, trials: number, progress: number };
const board: Leaderboard = {
  benchmark: 'robocolosseum', url: url + '#leaderboard', feed, terms: 'Public results from the RoboColosseum leaderboard, https://robocolosseum.ai/.',
  headline: 'The board ranks policies separately for each robot. The headline is the Franka Open track rating, which the board shows first.',
  parts: { frankaOpen: 'Franka Open', frankaFine: { name: 'Franka Fine-tune: Full success', unit: '%' },
    frankaProgress: { name: 'Franka Fine-tune: Progress', unit: '%' } },
  async fetch() {
    const { board: ratings } = await fetchJson<{board: Rating[]}>(feed);
    const { board: fine } = await fetchJson<{board: Fine[]}>(url + 'api/leaderboard?track=fine-tuning');
    const rows = ratings.filter(r => r.robotId === 'franka' && r.track === 'open' && r.score !== null).map(r => {
      const score = r.score!;
      const metrics: Record<string, number> = { frankaOpen: score, wins: r.wins, losses: r.losses, ties: r.ties,
        [r.ratingMethod === 'dcr' ? 'std' : 'stderr']: r.std };
      const tasks = fine.filter(f => f.robotId === 'franka' && f.policyId === r.policyId && f.trials > 0);
      if (tasks.length) {
        const trials = tasks.reduce((s, t) => s + t.trials, 0);
        metrics.frankaFine = 100 * tasks.reduce((s, t) => s + t.successes, 0) / trials;
        metrics.frankaProgress = tasks.reduce((s, t) => s + t.progress * t.trials, 0) / trials;
        metrics.fineTrials = trials;
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Missing Franka results');
      return { model: r.policyId, score, setting: r.revision || undefined, metrics, trials: r.evals,
        low: r.ratingCiLow ?? undefined, high: r.ratingCiHigh ?? undefined };
    });
    return checked(rows, 8);
  },
};
export default board;
