// RoboColosseum compares robot policies in blind physical trials. The site opens on the Franka Open track.
// The leaderboard API reports a separate rating for each embodiment and task results for fine-tuned policies.
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';

const url = 'https://robocolosseum.ai/';
const feed = url + 'api/leaderboard?track=open';
type Rating = { track: string, robotId: string, policyId: string, revision: string, modelUrl?: string, score: number | null,
  ratingCiLow: number | null, ratingCiHigh: number | null, std: number, evals: number, ratingMethod: string,
  wins: number, losses: number, ties: number, successes?: number, successRate?: number | null };
type Fine = { robotId: string, policyId: string, successes: number, trials: number, progress: number };
const board: Leaderboard = {
  benchmark: 'robocolosseum', url: url + '#leaderboard', feed, terms: 'Public results from the RoboColosseum leaderboard, https://robocolosseum.ai/.',
  headline: 'The board ranks policies separately for each robot. The headline is the Franka Open track rating, which the board shows first.',
  aliases: {
    'gpt-6-astra-droid': 'gpt-6-astra',
    'molmoact2-droid': 'molmoact-2',
    'claude-fable-5-2-droid': 'claude-fable-5-2',
    'claude-opus-5-5-droid': 'claude-opus-5-5',
    'gr00t-n17-droid': 'gr00t-n1-7',
    'pi05-droid': 'pi0-5',
    'grok-4.7-droid': 'grok-4-7',
  },
  parts: { frankaOpen: 'Franka Open', frankaFine: { name: 'Franka Fine-tune: Full success', unit: '%' },
    frankaProgress: { name: 'Franka Fine-tune: Progress', unit: '%' } },
  stats: {
    wins: { name: 'Wins', unit: 'count' },
    losses: { name: 'Losses', unit: 'count' },
    ties: { name: 'Ties', unit: 'count' },
    successes: { name: 'Task successes', unit: 'count' },
    successRate: { name: 'Task success rate', unit: '%', better: 'higher' },
  },
  async fetch() {
    const { board: ratings } = await fetchJson<{board: Rating[]}>(feed);
    const { board: fine } = await fetchJson<{board: Fine[]}>(url + 'api/leaderboard?track=fine-tuning');
    const rows = ratings.filter(r => r.robotId === 'franka' && r.track === 'open' && r.score !== null).map(r => {
      const score = r.score!;
      const metrics: Record<string, number> = { frankaOpen: score, wins: r.wins, losses: r.losses, ties: r.ties,
        [r.ratingMethod === 'dcr' ? 'std' : 'stderr']: r.std };
      if (typeof r.successes === 'number' && Number.isFinite(r.successes)) metrics.successes = r.successes;
      if (typeof r.successRate === 'number' && Number.isFinite(r.successRate)) metrics.successRate = r.successRate;
      const tasks = fine.filter(f => f.robotId === 'franka' && f.policyId === r.policyId && f.trials > 0);
      if (tasks.length) {
        const trials = tasks.reduce((s, t) => s + t.trials, 0);
        metrics.frankaFine = 100 * tasks.reduce((s, t) => s + t.successes, 0) / trials;
        metrics.frankaProgress = tasks.reduce((s, t) => s + t.progress * t.trials, 0) / trials;
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Missing Franka results');
      const link = r.modelUrl?.startsWith('https://huggingface.co/') ? r.modelUrl : undefined;
      return { model: r.policyId, score, setting: r.revision || undefined, link, metrics, trials: r.evals,
        low: r.ratingCiLow ?? undefined, high: r.ratingCiHigh ?? undefined };
    });
    return checked(rows, 8);
  },
};
export default board;
