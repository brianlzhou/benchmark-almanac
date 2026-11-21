// FlavourBench ranks models by their point estimate on the common set of ingredient-selection tasks.
// Its complete-core JSONL file gives simultaneous 95% intervals and scores for each family and panel.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

interface Entry { model_name: string; flavourbench_score: number; family_scores: Record<string,number>;
  score_simultaneous_95_ci: number[]; score_pointwise_95_ci: number[]; bootstrap_rank_95_interval: number[];
  statistical_rank_group: number; score_standard_error: number; point_estimate_rank: number; execution_backend: string;
  coverage: {completed: number; parseable: number; scheduled: number; valid_scored: number};
  panel_replication: {panel_1: number; panel_2: number}; route: {final_reasoning_effort: string; final_max_output_tokens?: number} }

const feed = "https://huggingface.co/datasets/josefchen/flavourbench/resolve/main/data-complete-core/leaderboard.jsonl";
const board: Leaderboard = {
  benchmark: 'flavourbench-complete-core',
  url: "https://github.com/josefchen/flavourbench#result",
  feed,
  terms: "Hugging Face allows this file in robots.txt. The authors license derived scores and prompts under CC BY 4.0. Provider responses retain their original terms. https://raw.githubusercontent.com/josefchen/flavourbench/main/LICENSES.md",
  parts: { constraint: 'Constraint', pairing: 'Pairing', substitution: 'Substitution', panel1: 'Panel 1', panel2: 'Panel 2' },
  aliases: { 'Command A': 'cohere-command-a', 'Mistral Large 3 2512': 'mistral-large-3', Hy3: 'tencent-hy3' },
  async fetch() {
    const entries = (await fetchText(feed)).trim().split(/\r?\n/).map(s => JSON.parse(s) as Entry);
    if (entries.length < 27) throw new Error('Incomplete FlavourBench complete core');
    return entries.map(r => {
      const [low, high] = r.score_simultaneous_95_ci, [pointLow,pointHigh] = r.score_pointwise_95_ci;
      const [rankLow,rankHigh] = r.bootstrap_rank_95_interval;
      const {constraint,pairing,substitution} = r.family_scores;
      const metrics = { constraint, pairing, substitution, pointLow, pointHigh, rankLow, rankHigh,
        group: r.statistical_rank_group, rank: r.point_estimate_rank, standardError: r.score_standard_error,
        panel1: r.panel_replication.panel_1, panel2: r.panel_replication.panel_2,
        completed: r.coverage.completed, scheduled: r.coverage.scheduled, valid: r.coverage.valid_scored, parseable: r.coverage.parseable,
        ...(r.route.final_max_output_tokens == null ? {} : { maxOutputTokens: r.route.final_max_output_tokens }) };
      if (!r.model_name || ![r.flavourbench_score,low,high,...Object.values(metrics)].every(Number.isFinite)) throw new Error('Incomplete FlavourBench entry');
      return { model: r.model_name.replace(/^[^:]+: /,''), score: r.flavourbench_score, low, high, harness: r.execution_backend,
        setting: r.route.final_reasoning_effort, metrics };
    });
  },
};
export default board;
