// AZ-Bench evaluates coding agents that train a Connect Four player. Figure 5 plots the mean Bradley-Terry rating.
// The results JSON anchors the Pons solver at 2000. The timing file gives training seconds for the same trial IDs.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const repo = 'https://raw.githubusercontent.com/jsherwood00/C4AI/HEAD/';
const feed = repo + 'outputs/bt_ratings.json';
const groups: [string, string, string, number][] = [
  ['opus47_t', 'Opus 4.7', 'Main tournament', 8], ['claude_t', 'Opus 4.6', 'Main tournament', 8],
  ['codex_t', 'GPT-5.4', 'Main tournament', 8], ['gemini_t', 'Gemini 3.1 Pro', 'Main tournament', 8],
  ['eval_d', 'GPT-5.4', 'Eval, Docker', 4], ['eval_nd', 'GPT-5.4', 'Eval, non-Docker', 4],
  ['noneval_d', 'GPT-5.4', 'Non-eval, Docker', 4], ['noneval_nd', 'GPT-5.4', 'Non-eval, non-Docker', 4],
];
type Results = { metadata: {anchor_rating: number}, ratings: Record<string, number>,
  vs_perfect: Record<string, { wins: number, losses: number, draws: number, wins_as_first: number, games_as_first: number }> };
const board: Leaderboard = {
  benchmark: 'alphazero-connect-four-study', feed, url: 'https://github.com/jsherwood00/C4AI',
  terms: 'The authors publish the tournament release on GitHub, https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  aliases: { 'Opus 4.7': 'claude-opus-4-7', 'Opus 4.6': 'claude-opus-4-6' },
  async fetch() {
    const data = await fetchJson<Results>(feed);
    if (data.metadata.anchor_rating !== 2000) throw new Error('Changed rating anchor');
    const times = new Map((await fetchText(repo + 'input/player_times_seconds.txt')).trim().split('\n').map(line => {
      const [id, seconds] = line.trim().split(/\s+/); return [id, Number(seconds)] as const;
    }));
    const rows = groups.map(([prefix, model, setting, trials]) => {
      const ids = Object.keys(data.ratings).filter(id => id.startsWith(prefix));
      if (ids.length !== trials) throw new Error('Unexpected trial count for ' + model);
      const ratings = ids.map(id => data.ratings[id]);
      const metrics = { bestRating: Math.max(...ratings), trainingSeconds: 0, wins: 0, losses: 0, draws: 0, winsAsFirst: 0, gamesAsFirst: 0 };
      for (const id of ids) {
        const games = data.vs_perfect[id];
        metrics.wins += games.wins; metrics.losses += games.losses; metrics.draws += games.draws;
        metrics.winsAsFirst += games.wins_as_first; metrics.gamesAsFirst += games.games_as_first;
        metrics.trainingSeconds += times.get(id)! / trials;
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Incomplete trial data');
      return { model, setting, trials, score: ratings.reduce((a, b) => a + b, 0) / trials, metrics };
    });
    return checked(rows, 8);
  },
};
export default board;
