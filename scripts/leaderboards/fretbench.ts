// FretBench scores exact answers to guitar tablature questions. The page embeds full-precision accuracy, cost and accuracy for four tunings.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';
interface Run { model_name: string; score_pct: number; total_cost: number; completed_at: string; open_weight: boolean; tuning_scores: Record<string, number> }

const FEED = "https://fretbench.tymo.ai/results";
const board: Leaderboard = {
  benchmark: "fretbench",
  url: "https://fretbench.tymo.ai/results",
  feed: FEED,
  terms: "The results page and repository state the MIT license. The creator keeps the full question set private. https://github.com/jmcapra/FretBench The robots rules allow general access and disallow training crawlers.",
  costPer: 'run',
  parts: { 'Drop D': 'Drop D', 'Drop Db': 'Drop Db', 'Half-Step Down': 'Half-Step Down', Standard: 'Standard' },
  async fetch() {
    const runs = jsonAfter<Run[]>(await fetchText(FEED), 'const leaderboard = ');
    if (runs.length < 21) throw new Error('Missing FretBench configurations');
    return runs.map(r => {
      if (!r.model_name || ![r.score_pct, r.total_cost, ...Object.keys(board.parts!).map(k => r.tuning_scores[k])].every(Number.isFinite)) throw new Error('Invalid FretBench scores');
      return { model: r.model_name.replace(/ \(Reasoning\)$/, ''), setting: r.model_name.endsWith('(Reasoning)') ? 'Reasoning' : undefined,
        score: r.score_pct, cost: r.total_cost, date: r.completed_at.slice(0, 10), open: r.open_weight, metrics: r.tuning_scores };
    });
  },
};
export default board;
