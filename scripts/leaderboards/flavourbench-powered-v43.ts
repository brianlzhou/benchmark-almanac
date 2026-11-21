// FlavourBench Powered v43 ranks eligible models on 640 ingredient selection tasks.
// The archived JSONL leaderboard gives the score, category results and bootstrap intervals.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://huggingface.co/datasets/josefchen/flavourbench/resolve/abfa738aece424a4a04f59b1261a7f10d0de82b2/data-powered/leaderboard.jsonl";
const board: Leaderboard = {
  benchmark: "flavourbench-powered-v43",
  url: "https://huggingface.co/datasets/josefchen/flavourbench/blob/abfa738aece424a4a04f59b1261a7f10d0de82b2/data-powered/leaderboard.jsonl",
  feed,
  terms: "The archived dataset card licenses derived tables and prompts under CC BY 4.0. Provider responses keep their own terms. Hugging Face robots.txt permits the archived file.",
  aliases: {
    "SpaceXAI: Grok 4.6": "grok-4-6",
    "Meta: Muse Spark 1.2": "muse-spark-1-2",
    "OpenAI: GPT-5.6 Sol Pro": "gpt-5-6-sol-pro",
    "Qwen: Qwen3.8 Max": "qwen-3-8-max",
    "Qwen: Qwen3.8 2.4T A95B": "qwen3-8-2-4t-a95b",
    "Claude Opus 5": "claude-opus-5",
    "MoonshotAI: Kimi K3": "kimi-k3",
    "Google: Gemini 3.6 Flash": "gemini-3-6-flash",
    "Anthropic: Claude Sonnet 5": "claude-sonnet-5",
    "DeepSeek: DeepSeek V4 Pro 0813": "deepseek-v4-pro-0813",
    "Z.ai: GLM 5.2": "glm-5-2",
    "MiniMax: MiniMax M3": "minimax-m3",
    "Thinking Machines: Inkling": "inkling",
    "DeepSeek: DeepSeek V4 Flash 0731": "deepseek-v4-flash-0731",
    "Meta: Llama 4 Maverick": "llama-4-maverick",
    "Cohere: Command A": "cohere-command-a",
    "Anthropic: Claude Fable 5": "claude-fable-5"
},
  parts: { constraint: 'Constraint', cultural_composition: 'Cultural composition', pairing: 'Pairing', substitution: 'Substitution' },
  async fetch() {
    type Entry = { eligible: boolean; model_name: string; flavourbench_score: number; score_pointwise_95_ci: number[];
      score_simultaneous_95_ci: number[]; bootstrap_rank_95_interval: number[]; score_standard_error: number;
      availability: { completed: number; scheduled: number; parseable: number }; family_scores: Record<string, number> };
    const entries: Entry[] = (await fetchText(feed)).trim().split(/\r?\n/).map(line => JSON.parse(line));
    const rows = entries.filter(r => r.eligible).map(r => {
      const [low, high] = r.score_pointwise_95_ci;
      const [simultaneousLow, simultaneousHigh] = r.score_simultaneous_95_ci;
      const [rankLow, rankHigh] = r.bootstrap_rank_95_interval;
      if (!r.model_name || ![r.flavourbench_score, low, high, ...Object.keys(board.parts!).map(k => r.family_scores[k])].every(Number.isFinite)) throw new Error('Incomplete FlavourBench score');
      return { model: r.model_name, score: r.flavourbench_score, low, high, metrics: { ...r.family_scores, ...r.availability,
        simultaneousLow, simultaneousHigh, rankLow, rankHigh, standardError: r.score_standard_error } };
    });
    if (rows.length !== 25) throw new Error('Unexpected ranked field in archived FlavourBench');
    return rows;
  },
};
export default board;
