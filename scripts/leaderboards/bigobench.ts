// BigO(Bench). facebookresearch.github.io/BigOBench/leaderboard.html builds its table from
// data/model_results_for_leaderboard.json (per model: time and space, each with prediction, generation and
// ranking metrics). The page opens on Time Prediction and ranks models by all@1 ("Models are ranked
// according to all@1"), so the score is time.prediction["all@1"], the share of problems where the model
// predicts the right time complexity for every complexity class. The other tabs are not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const SITE = 'https://facebookresearch.github.io/BigOBench';
const FEED = `${SITE}/data/model_results_for_leaderboard.json`;

type Result = { time?: { prediction?: Record<string, number> } };

const board: Leaderboard = {
  benchmark: 'bigobench',
  url: `${SITE}/leaderboard.html`,
  feed: `${FEED} (time.prediction all@1)`,
  terms: 'Static JSON on GitHub Pages that the leaderboard loads; robots.txt allows it and the BigOBench repository is CC BY-NC 4.0.',
  aliases: {
    'Codestral 22B': 'codestral',
    'Qwen2.5-Coder 32B': 'qwen2-5-coder-32b-instruct',
    'DeepSeekV3 671B': 'deepseek-v3',
    'DeepSeekV3-0324 671B': 'deepseek-v3-mar-2025',
    'DeepSeekR1 Qwen 32B': 'deepseek-r1-distill-qwen-32b',
    'DeepSeekR1 Llama 70B': 'deepseek-r1-distill-llama-70b',
    'Llama 3.1 Nemotron-Ultra 253B': 'llama-3-1-nemotron-ultra-253b-v1',
    'OpenHands LM v0.1 32B': 'openhands-lm-32b-v0-1',
    'Llama 4 Scout 17Bx16E': 'llama-4-scout',
    'Llama 4 Maverick FP8 17Bx128E': 'llama-4-maverick',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<Record<string, Result>>(FEED);
    return Object.entries(data).map(([model, r]) => ({ model, score: r.time?.prediction?.['all@1'] ?? NaN }));
  },
};
export default board;
