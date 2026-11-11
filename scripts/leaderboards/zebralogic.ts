// ZebraLogic (Ai2). The allenai/ZebraLogic Space builds its table from a summary file committed in the Space,
// ZeroEval-main/result_dirs/zebra-grid.summary.json: per run the model, decoding mode, Puzzle Acc (share of
// puzzles solved fully, 0 to 100), Cell Acc and splits by size. The Space keeps only runs over all 1,000
// puzzles, and so does the importer. Puzzle Acc is the score. "o3-mini-2025-01-31-high" carries the reasoning
// effort, which becomes the setting, and "@together" style suffixes name the API provider, kept as harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/allenai/ZebraLogic/resolve/main/ZeroEval-main/result_dirs/zebra-grid.summary.json';

interface Run {
  Model: string;
  'Puzzle Acc': string;
  'Total Puzzles': number;
}

/**
 * Runs the resolver would place on a different release: Gemini experimental builds the registry does not
 * record, plain Gemini 1.5 names that do not say which snapshot ran, and the April 2024 Command R+ (the
 * registry has only the August 2024 one).
 */
const UNLISTED = new Set(['gemini-1.5-pro-exp-0827', 'gemini-1.5-pro-exp-0801', 'gemini-1.5-flash-exp-0827', 'gemini-1.5-pro', 'gemini-1.5-flash', 'command-r-plus']);

const board: Leaderboard = {
  benchmark: 'zebralogic',
  url: 'https://huggingface.co/spaces/allenai/ZebraLogic',
  feed: `${FEED} (Puzzle Acc)`,
  terms: "A results file committed in Ai2's public Space, read through Hugging Face's file endpoint; the ZeroEval code that writes it is Apache-2.0.",
  aliases: {
    'deepseek-R1': 'deepseek-r1',
    'deepseek-v3': 'deepseek-v3',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'gpt-4o-2024-08-06': 'gpt-4o-aug-2024',
    'gpt-4o-2024-05-13': 'gpt-4o-may-2024',
    'gpt-4-0314': 'gpt-4-mar-2023',
    'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024',
    'Llama-3.1-405B-Inst-fp8': 'llama-3-1-405b',
    'Llama-3.1-405B-Inst': 'llama-3-1-405b',
    'Meta-Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Meta-Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Meta-Llama-3-70B-Instruct': 'llama-3-70b',
    'Meta-Llama-3-8B-Instruct': 'llama-3-8b',
    'Llama-3.2-3B-Instruct': 'llama-3-2-3b',
    'Mistral-Large-2': 'mistral-large-2-jul-2024',
    'Mistral-Nemo-Instruct-2407': 'mistral-nemo',
    'Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
    'Qwen2.5-72B-Instruct': 'qwen2-5-72b',
    'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'Qwen2.5-3B-Instruct': 'qwen2-5-3b',
    'Qwen2-72B-Instruct': 'qwen2-72b',
    'gemma-2-27b-it': 'gemma-2-27b',
    'gemma-2-9b-it': 'gemma-2-9b',
    'Phi-3.5-mini-instruct': 'phi-3-5-mini',
    'Yi-1.5-34B-Chat': 'yi-1-5-34b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of await fetchJson<Run[]>(FEED)) {
      const score = Number(r['Puzzle Acc']);
      if (r['Total Puzzles'] !== 1000 || !r.Model || !Number.isFinite(score)) continue;
      let model = r.Model.trim();
      const unlisted = UNLISTED.has(model);
      let setting: string | undefined;
      let harness: string | undefined;
      const at = model.match(/@([\w-]+)$/);
      if (at) {
        harness = at[1];
        model = model.slice(0, at.index);
      }
      // Retain repeat evaluations as separate configurations.
      const rerun = model.match(/-(v\d+)$/);
      if (rerun && /\d{4}-\d\d-\d\d-v\d+$/.test(model)) {
        setting = `rerun ${rerun[1]}`; model = model.slice(0, rerun.index);
      }
      if (unlisted) model += " (unlisted snapshot)";
      const effort = model.match(/^(o\d-mini)-\d{4}-\d\d-\d\d-(low|medium|high)$/);
      rows.push({ model: effort ? effort[1] : model, setting: effort?.[2] ?? setting, harness, score });
    }
    if (!rows.length) throw new Error('no full runs in the summary');
    return rows;
  },
};
export default board;
