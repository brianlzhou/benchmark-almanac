// Vectara Hallucination Leaderboard on its original dataset (about 1,000 short documents). The current
// vectara/hallucination-leaderboard README is the 2025 dataset (vectara-hallucination-leaderboard-2.ts) and
// points to the hhem-2.3-old-dataset branch as the most recent board on the previous dataset, scored with
// HHEM-2.1 and last updated in October 2025. That branch's README table is read: Hallucination Rate (lower is
// better, the ranking and the score), Factual Consistency Rate, Answer Rate and summary length. Names lead
// with the vendor ("Google Gemini-2.0-Flash-001", "OpenAI GPT-4o"), which is dropped when it is a known
// company word. A "-Think" suffix ("Claude-3.7-Sonnet-Think") becomes the thinking setting. Answer Rate
// (percent) and Average Summary Length (words) are kept as metrics.answerRate and metrics.summaryWords; the
// Factual Consistency Rate is 100 minus the score, so it is not kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdRecords, mdTables } from './big-bench-extra-hard.ts';

const FEED = 'https://raw.githubusercontent.com/vectara/hallucination-leaderboard/hhem-2.3-old-dataset/README.md';
const VENDORS = /^(OpenAI|Google|Anthropic|Meta|Microsoft|Mistral|Mistral AI|Amazon|Cohere|xAI|DeepSeek|Qwen|Alibaba|Zhipu AI|Zhipu|IBM|Nvidia|NVIDIA|AI21|AI21 Labs|01-AI|Snowflake|Databricks|Moonshot AI|MiniMax|Baidu|Tencent|ByteDance|AntGroup|Ant Group|Apple|TII|Allen AI|Ai2|Intel|Salesforce|Liquid AI|Perplexity|Reka|Writer|Upstage|InternLM|THUDM|Xiaomi|Meituan|Inception|LG AI|LG|Naver|SKT|Kakao|XAI|ZhipuAI|DeepSeek-AI|MoonshotAI|MistralAI|databricks|TNGTech|Vectara)\s+|^AllenAI-/;

const board: Leaderboard = {
  benchmark: 'vectara-hallucination-leaderboard-hhem',
  url: 'https://github.com/vectara/hallucination-leaderboard/tree/hhem-2.3-old-dataset',
  feed: `${FEED} (Hallucination Rate)`,
  terms: 'README table on a branch of the vectara/hallucination-leaderboard repository, licensed Apache-2.0.',
  // instruct and chat checkpoints map to the registry's one record per family
  aliases: {
    'Gemini-2.0-Flash-001': 'gemini-2-0-flash-feb-2025',
    'Gemini-1.5-Flash-002': 'gemini-1-5-flash-sep-2024',
    'Gemini-1.5-Pro-002': 'gemini-1-5-pro-sept-2024',
    // the July 2025 release (the September update is listed as Kimi-K2-Instruct-0905)
    'Kimi-K2-Instruct': 'kimi-k2-jul-2025',
    'Kimi-K2-Instruct-0905': 'kimi-k2-sep-2025',
    'OpenAI-o1-mini': 'o1-mini',
    'Nova-Micro-V1': 'amazon-nova-micro',
    'Nova-Lite-V1': 'amazon-nova-lite',
    'Nova-Pro-V1': 'amazon-nova-pro',
    'GLM-4.5-Air-FP8': 'glm-4-5-air',
    'Grok-3-Beta': 'grok-3',
    'Grok-3-Mini-Beta': 'grok-3-mini',
    'Grok-4-0709': 'grok-4',
    'Gemma-3-1B-Instruct': 'gemma-3-1b',
    'Gemma-3-4B-Instruct': 'gemma-3-4b',
    'Gemma-3-12B-Instruct': 'gemma-3-12b',
    'Gemma-3-27B-Instruct': 'gemma-3-27b',
    'Gemma-2-9B-it': 'gemma-2-9b',
    'Gemma-7B-it': 'gemma-7b',
    'Qwen2.5-0.5B-Instruct': 'qwen2-5-0-5b',
    'Qwen2.5-1.5B-Instruct': 'qwen2-5-1-5b',
    'Qwen2.5-3B-Instruct': 'qwen2-5-3b',
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'Qwen2.5-14B-Instruct': 'qwen2-5-14b',
    'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
    'Qwen3-30b-a3b-thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025',
    'Qwen-QwQ-32B-Preview': 'qwq-32b-preview',
    'Phi-4-mini-instruct': 'phi-4-mini',
    'Phi-3.5-mini-instruct': 'phi-3-5-mini',
    'Yi-1.5-34B-Chat': 'yi-1-5-34b',
    'Llama-3.1-405B-Instruct': 'llama-3-1-405b',
    'Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Llama-3-70B-Chat-hf': 'llama-3-70b',
    'Llama-3-8B-Chat-hf': 'llama-3-8b',
    'Llama-2-70B-Chat-hf': 'llama-2-70b',
    'Llama-2-13B-Chat-hf': 'llama-2-13b',
    'Llama-2-7B-Chat-hf': 'llama-2-7b',
    'Llama-3.2-3B-Instruct': 'llama-3-2-3b',
    'Llama-3.2-1B-Instruct': 'llama-3-2-1b',
    'Claude-4-Sonnet': 'claude-sonnet-4',
    'Claude-4-Opus': 'claude-opus-4',
    'Claude-3.7-Sonnet': 'claude-3-7-sonnet',
    'Command-A': 'cohere-command-a',
    'Mixtral-8x22B-Instruct-v0.1': 'mixtral-8x22b',
    'Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
    'Mistral-Small-3.1-24B-Instruct': 'mistral-small-3-1',
    'Mistral-Ministral-8B': 'ministral-8b',
    'Mistral-Ministral-3B': 'ministral-3b',
    'Mistral-7B-Instruct-v0.3': 'mistral-7b-v0-3',
    'Mistral-Medium-2508': 'mistral-medium-3-1',
    'Mistral-Nemo-Instruct': 'mistral-nemo',
    'dbrx-instruct': 'dbrx',
    'Qwen2.5-72B-Instruct': 'qwen2-5-72b',
    'Qwen2-72B-Instruct': 'qwen2-72b',
    'GLM-4.5': 'glm-4-5',
    'GLM-4.6': 'glm-4-6',
    // the board lists later snapshots under their own names ("DeepSeek-R1-0528", "DeepSeek-V3-0324",
    // "Gemini-2.5-Pro-Preview-06-05"), so the plain or experimental names are the earlier releases
    'DeepSeek-R1': 'deepseek-r1',
    'DeepSeek-V3': 'deepseek-v3',
    'Gemini-2.5-Pro-Exp-0325': 'gemini-2-5-pro-mar-2025',
    'Gemini-2.0-Flash-Exp': 'gemini-2-0-flash-dec-2024',
    'Gemini-2.5-Flash-Preview': 'gemini-2-5-flash-apr-2025',
    'Gemini-2.5-Flash-Lite': 'gemini-2-5-flash-lite-jun-2025',
  },
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => x.head[0] === 'Model' && x.head[1] === 'Hallucination Rate');
    if (!t) throw new Error('Vectara old-dataset table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of mdRecords(t)) {
      const score = num(r['Hallucination Rate']);
      let model = r.Model?.replace(VENDORS, '').trim();
      if (!model || score === undefined) continue;
      const think = /-Think$/.test(model);
      if (think) model = model.replace(/-Think$/, '');
      const metrics: Record<string, number> = {};
      const answerRate = num(r['Answer Rate']);
      const summaryWords = num(r['Average Summary Length (Words)']);
      if (answerRate !== undefined) metrics.answerRate = answerRate;
      if (summaryWords !== undefined) metrics.summaryWords = summaryWords;
      rows.push({ model, score, setting: think ? 'thinking' : undefined, metrics: Object.keys(metrics).length ? metrics : undefined });
    }
    return rows;
  },
};
export default board;
