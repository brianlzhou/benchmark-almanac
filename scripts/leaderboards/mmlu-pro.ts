// MMLU-Pro on the TIGER-Lab Hugging Face space. The space (app.py, utils.py) reads results.csv from the
// TIGER-Lab/mmlu_pro_leaderboard_submission dataset and sorts by Overall, an accuracy fraction (0 to 1);
// Overall is the score here (0 to 100). A Data Source column marks each row "TIGER-Lab" (run by the
// makers) or "Self-Reported" (submitted by the model's authors); the board shows both, and so does this
// importer. Names such as "Claude-4.6-Opus(Thinking)", "Gemini-3-Pro(11/25)" and "GPT-4o (2024-05-13)" are
// rewritten into registry order, with the date stamp passed on and the run month dropped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://huggingface.co/datasets/TIGER-Lab/mmlu_pro_leaderboard_submission/resolve/main/results.csv';

function clean(raw: string): { model: string; setting?: string; date?: string } {
  let model = raw.trim();
  let setting: string | undefined;
  // "GPT-4o (2024-05-13)": a snapshot date for the resolver
  const stamp = model.match(/\s*\((\d{4}-\d\d-\d\d)\)$/);
  if (stamp) model = model.slice(0, stamp.index).trim();
  // "Gemini-3-Pro(11/25)": the month the row was added
  model = model.replace(/\s*\(\d\d\/\d\d\)/, '').trim();
  // "Nemotron-3-Nano-30B-A3B (FP8)": the serving precision
  const precision = model.match(/\s*\((BF16|FP8|FP16|INT8|INT4)\)$/i);
  if (precision) {
    model = model.slice(0, precision.index).trim();
    setting = precision[1].toLowerCase();
  }
  // "DeepSeek-V3.1-NonThinking": the mode as a bare suffix
  if (/-NonThinking$/i.test(model)) {
    model = model.replace(/-NonThinking$/i, '');
    setting = 'non-thinking';
  }
  // "Claude-4.6-Opus(Thinking)", "Claude-4-Opus-Thinking": Anthropic's names from Claude 4 on put the tier
  // first; "Claude-3.5-Sonnet" already matches the registry's older order
  model = model.replace(/^Claude-([4-9](?:\.\d+)?)-(Opus|Sonnet|Haiku)\b/i, 'Claude $2 $1');
  model = model.replace(/^GPT-(o\d)/i, '$1').replace(/(\S)\(/, '$1 (');
  // the registry names the October 2024 Claude 3.5 Sonnet apart, so the date stamp alone cannot reach it
  if (/^Claude-3\.5-Sonnet$/i.test(model) && stamp?.[1] === '2024-10-22') model = 'Claude 3.5 Sonnet (October 2024)';
  return { model, setting, date: stamp?.[1] };
}

const board: Leaderboard = {
  benchmark: 'mmlu-pro',
  url: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
  feed: FEED,
  terms: 'CSV in the Hugging Face dataset TIGER-Lab/mmlu_pro_leaderboard_submission, licensed Apache-2.0.',
  aliases: {
    // instruct and chat releases of models the registry lists once
    'Llama-3-8B-Instruct': 'llama-3-8b',
    'Llama-3-70B-Instruct': 'llama-3-70b',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Llama-3.1-405B-Instruct': 'llama-3-1-405b',
    'Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
    'Mixtral-8x22B-Instruct-v0.1': 'mixtral-8x22b',
    'Qwen2-72B-Chat': 'qwen2-72b',
    'Yi-1.5-34B-Chat': 'yi-1-5-34b',
    'Gemma-2-9B-it': 'gemma-2-9b',
    'Gemma-2-27B-it': 'gemma-2-27b',
    'Gemma-3-1B-it': 'gemma-3-1b',
    'Gemma-3-4B-it': 'gemma-3-4b',
    'Gemma-3-12B-it': 'gemma-3-12b',
    'Gemma-3-27B-it': 'gemma-3-27b',
    'Gemini-1.5-Pro-002': 'gemini-1-5-pro-sept-2024',
    'Gemini-1.5-Flash-002': 'gemini-1-5-flash-sep-2024',
    'Grok3-Beta': 'grok-3',
    'Grok3-mini-Beta': 'grok-3-mini',
    'Mistral-Large-Instruct-2407': 'mistral-large-2-jul-2024',
    'Mistral-Large-Instruct-2411': 'mistral-large-2-nov-2024',
    'Mistral-Small-Instruct-2409': 'mistral-small-v24-09',
    'Ministral-8B-Instruct-2410': 'ministral-8b',
    'Mistral-Nemo-Instruct-2407': 'mistral-nemo',
    'Mistral-3.1-Small': 'mistral-small-3-1',
    'Phi-3.5-mini-instruct': 'phi-3-5-mini',
    'Deepseek-V2-Chat': 'deepseek-v2-moe-236b-may-2024',
    'DeepSeek-Chat-V2_5': 'deepseek-v2-5-sep-2024',
    'DeepSeek-Coder-V2-Instruct': 'deepseek-coder-v2-236b',
    // the July 2025 release (the 0905 update is named Kimi-K2-Instruct-0905)
    'Kimi-K2-Instruct': 'kimi-k2-jul-2025',
    'Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-30B-A3B-Thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025',
    'Nemotron-3-Nano-30B-A3B': 'nemotron-3-nano-30b-a3b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.Overall);
      if (!r.Models || !Number.isFinite(score) || r.Overall === '') continue;
      rows.push({ ...clean(r.Models), score: score * 100 });
    }
    if (!rows.length) throw new Error('no rows in the MMLU-Pro results.csv');
    return rows;
  },
};
export default board;
