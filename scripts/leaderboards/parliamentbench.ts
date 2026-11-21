// ParliamentBench tests reasoning and persuasion in a hidden-role game against Llama 3.3 70B opponents.
// The repository's bootstrap results give the overall win percentage, confidence interval and win rate by role.
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';
import type { Leaderboard } from './types.ts';

type Estimate = {point: number, sd: number, ci: [number, number]};
type Result = {n_games: number} & Record<'win_rate' | 'win_rate_liberal' | 'win_rate_fascist' | 'win_rate_hitler' | 'drr' | 'gsir' | 'ria', Estimate>;
const url = 'https://github.com/ItsNiklas/ParliamentBench';
const feed = 'https://raw.githubusercontent.com/ItsNiklas/ParliamentBench/HEAD/analysis/results/bootstrap_ci.json';
const board: Leaderboard = {
  benchmark: 'parliamentbench', url, feed,
  terms: 'The repository uses CC BY-NC-SA 4.0. https://github.com/ItsNiklas/ParliamentBench/blob/HEAD/LICENSE',
  headline: 'The score is the percentage of games the model won against Llama 3.3 70B opponents.',
  aliases: {'DeepSeek 3.1 Terminus': 'deepseek-v3-1-terminus', 'Mistral Small 24B': 'mistral-small-3', 'OLMo 3.1 32B': 'olmo-3-1-32b-instruct'},
  parts: {liberal: {name: 'Liberal', unit: '%'}, fascist: {name: 'Fascist', unit: '%'}, hitler: {name: 'Hitler', unit: '%'}},
  stats: {
    gsir: { name: 'Game-state impact rate', unit: 'score', better: 'higher', note: 'Impact of actions on the assigned team. Positive values benefit that team.' },
    drr: { name: 'Deception retention rate', unit: '%', better: 'higher', note: 'Full-round retention of a deceptive role.' },
    ria: { name: 'Role identification accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    // Python emits bare NaN for undefined pairwise tests outside the model results.
    const data = (await fetchText(feed)).replace(/(:\s*)NaN(?=\s*[,}])/g, '$1null');
    const {per_model}: {per_model: Record<string, Result>} = JSON.parse(data);
    const rows = Object.entries(per_model).filter(([model]) => !['Algorithmic Agent', 'Random Agent'].includes(model)).map(([model, r]) => {
      const {point: score, sd: std, ci: [low, high]} = r.win_rate;
      const metrics = {std, liberal: r.win_rate_liberal.point, fascist: r.win_rate_fascist.point,
        hitler: r.win_rate_hitler.point, gsir: r.gsir.point, drr: r.drr.point, ria: r.ria.point};
      if (![score, low, high, r.n_games, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Incomplete results for ' + model);
      return {model, score, low, high, trials: r.n_games, metrics};
    });
    return checked(rows, 12);
  },
};
export default board;
