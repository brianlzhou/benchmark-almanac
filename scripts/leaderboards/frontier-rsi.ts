// FrontierRSI: Abundant AI's board, read from the data file its page loads (window.FRSI in data.js). Each task
// keeps every model's two trials, each rewarded against the best valid trial on that task, and a model's task score
// is their mean (avg@2). The site's overall score is the mean over all 27 tasks, a task with no valid trial counting
// as 0, and each research area's score is the same mean over that area's tasks (app.js). Both are rebuilt here, and
// the areas and tasks are kept as parts. Cost is the agent API spend for both trials of every task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://frontier-rsi.org/';
interface Trial { reward: number | null; status: string }
interface Run { model: string; harness?: string; effort?: string; avg: number | null; trials: Trial[] }
interface Task { id: string; category: string; title: string; desc?: string; models: Run[] }
interface Data {
  categories: { id: string; name: string; blurb?: string }[];
  tasks: Task[];
  models: Record<string, { cost?: { total_usd?: number } }>;
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const pct = (x: number) => Math.round(x * 1e4) / 100;

const board: Leaderboard = {
  benchmark: 'frontier-rsi',
  harnesses: 'system',
  reference: ['mini-swe-agent'],
  url: SITE,
  feed: `${SITE}data.js (window.FRSI: every task's trials per model)`,
  terms: 'The site sets no robots.txt rules or terms. Results are credited to Abundant AI.',
  costPer: 'run',
  aliases: { 'Muse Wonder 1.0': 'muse-wonder' },
  parts: {
    'area:pretrain': { name: 'Pre-training', group: 'Research area', note: 'Optimizers, objectives, architectures and training of draft models, scored on held-out loss or latency.' },
    'area:posttrain': { name: 'Post-train and harness', group: 'Research area', note: 'Design RL data that teaches a small model multi-step coding, or improve the harness around a fixed worker model.' },
    'area:inference': { name: 'Inference and serving', group: 'Research area', note: 'Scheduling, routing, caching and batching for frozen-model serving, with exact greedy outputs.' },
    'area:kernels': { name: 'Kernels', group: 'Research area', note: 'Fast, numerically correct H100 kernels for attention, matrix products and sampling.' },
    'task:model-shape-efficiency': { name: 'Choose a transformer shape', group: 'Task', note: 'Pick transformer dimensions that minimize decode time for a fixed workload while meeting accuracy limits.' },
    'task:language-model-optimizer': { name: 'Design the optimizer', group: 'Task', note: 'Improve the parameter-update rule for a language model trained from scratch, to minimize held-out next-token loss.' },
    'task:training-objective-design': { name: 'Design the training objective', group: 'Task', note: 'Improve the training computation and objective of a fixed architecture, to minimize held-out next-token loss.' },
    'task:long-sequence-computation': { name: 'Speed up long-context attention', group: 'Task', note: 'Cut full-forward latency on 2K to 16K-token contexts while preserving causal attention and model quality.' },
    'task:speculative-draft-training': { name: 'Train a speculative draft model', group: 'Task', note: 'Train a small proposal model in 30 minutes that speeds up exact greedy decoding of frozen Qwen3-8B.' },
    'task:pt-multifile-numpy-rl-qwen3-4b': { name: 'RL data: NumPy bug fixing', group: 'Task', note: 'Design RL training data so that a fixed GRPO run teaches Qwen3-4B to fix bugs in multi-file NumPy projects.' },
    'task:pt-multifile-scipy-rl-qwen3-4b': { name: 'RL data: SciPy bug fixing', group: 'Task', note: 'Design RL training data so that a fixed GRPO run teaches Qwen3-4B to fix bugs in multi-file SciPy projects.' },
    'task:pt-chained-rl-qwen3-4b': { name: 'RL data: chained bugs', group: 'Task', note: 'Design RL training data that teaches Qwen3-4B to find and fix bugs that only show up one after another, over many tool calls.' },
    'task:pt-interfaceport-easy-rl-qwen3-4b': { name: 'RL data: interface porting', group: 'Task', note: 'Design RL training data that teaches Qwen3-4B to update callers after a module is rewritten to a new interface.' },
    'task:pt-multifile-rl-qwen3-4b': { name: 'RL data: multi-file bug fixing', group: 'Task', note: 'Design RL training data so that a fixed GRPO run teaches Qwen3-4B to fix bugs in multi-file Python projects with tools.' },
    'task:bfcl-harness': { name: 'Harness: BFCL v4 multi-turn', group: 'Task', note: 'Improve a reusable function-calling harness so a fixed worker model succeeds on unseen multi-turn BFCL v4 conversations.' },
    'task:swe-bench-harness': { name: 'Harness: SWE-bench Verified', group: 'Task', note: 'Improve a reusable repository-repair harness so a fixed worker model resolves unseen SWE-bench Verified issues.' },
    'task:webarena-verified-harness': { name: 'Harness: WebArena-Verified', group: 'Task', note: 'Improve a reusable web-agent harness so a fixed worker model completes unseen tasks on self-hosted websites.' },
    'task:bulk-inference': { name: 'Bulk inference', group: 'Task', note: 'Minimize the wall-clock time to generate responses for a large prompt collection with a frozen model, with exact outputs.' },
    'task:cache-aware-replica-routing': { name: 'Cache-aware replica routing', group: 'Task', note: 'Route requests across two model replicas with local prefix caches to minimize mean response latency.' },
    'task:separated-prefill-and-decode': { name: 'Disaggregated prefill and decode', group: 'Task', note: 'Split prompt processing and token generation across two GPUs to minimize the duration of a request stream.' },
    'task:adaptive-prefill-chunking': { name: 'Schedule prefill and decode', group: 'Task', note: 'Schedule prompt and generation work on one GPU to maximize output tokens per second within streaming latency limits.' },
    'task:branch-sharing-generation': { name: 'Shared-prompt branch generation', group: 'Task', note: 'Generate many continuations that share a long prompt as fast as possible, with exact greedy outputs.' },
    'task:kernel-parameter-update': { name: 'AdamW parameter update', group: 'Task', note: 'A fast AdamW optimizer kernel that updates 8 to 15 parameter tensors of up to 8 million elements each.' },
    'task:kernel-masked-attention': { name: 'Block-masked attention, forward and backward', group: 'Task', note: 'A fast block-sparse attention kernel for both passes, with 10% to 40% mask density.' },
    'task:kernel-causal-attention': { name: 'Causal attention, forward and backward', group: 'Task', note: 'A fast causal attention kernel for both the forward and backward passes, across 256 to 8,192 tokens.' },
    'task:kernel-independent-matrix-workload': { name: 'Grouped matrix products', group: 'Task', note: 'One fast kernel for a group of 2 to 64 independent matrix products of different sizes.' },
    'task:kernel-projected-state-attention': { name: 'Latent-projected attention', group: 'Task', note: 'Attention over a projected latent state, for batches of 1 to 32 and contexts up to 32,768 tokens.' },
    'task:kernel-fragmented-state-attention': { name: 'Paged attention', group: 'Task', note: 'Attention that reads keys and values through a page table, for contexts of 512 to 32,768 tokens.' },
    'task:kernel-rectangular-matrix-workload': { name: 'Rectangular matrix products', group: 'Task', note: 'A matrix-product plan that stays fast on highly rectangular shapes from 64 to 8,192.' },
    'task:kernel-single-query-attention': { name: 'Single-query decode attention', group: 'Task', note: 'Attention for one query over a long context of up to 65,536 tokens.' },
    'task:kernel-logit-selection': { name: 'Top-k and top-p sampling', group: 'Task', note: 'A fast sampling kernel with top-k, top-p and temperature over vocabularies of up to 131,072 tokens.' },
  },
  async fetch() {
    const js = await fetchText(SITE + 'data.js');
    const json = js.slice(js.indexOf('{'), js.lastIndexOf('}') + 1);
    const d = JSON.parse(json) as Data;
    if (d.tasks.length < 20) throw new Error(`FrontierRSI: ${d.tasks.length} tasks, expected 27`);
    const models = [...new Set(d.tasks.flatMap((t) => t.models.map((r) => r.model)))];
    return models.map((model): LeaderboardRow => {
      const runs = d.tasks.map((t) => ({ t, r: t.models.find((r) => r.model === model) }));
      const score = (ts: typeof runs) => pct(mean(ts.map(({ r }) => r?.avg ?? 0)));
      const metrics: Record<string, number> = {};
      for (const c of d.categories) metrics[`area:${c.id}`] = score(runs.filter(({ t }) => t.category === c.id));
      for (const { t, r } of runs) if (r && r.avg !== null) metrics[`task:${t.id}`] = pct(r.avg);
      const first = runs.find(({ r }) => r)?.r;
      return {
        model,
        score: score(runs),
        harness: first?.harness,
        setting: first?.effort,
        trials: 2,
        cost: d.models[model]?.cost?.total_usd,
        metrics,
      };
    });
  },
};
export default board;
