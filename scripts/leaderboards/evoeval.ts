// EvoEval tests code generation on variations of HumanEval tasks. The official page ranks by joint_score.
// It reads data.json, where the overall score is a percentage and component pass rates are fractions.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://evo-eval.github.io/data.json';
const parts = { humaneval: 'HumanEval', EvoEval_difficult: 'Difficult', EvoEval_creative: 'Creative',
  EvoEval_subtle: 'Subtle', EvoEval_combine: 'Combine', EvoEval_tool_use: 'Tool Use',
  EvoEval_verbose: 'Verbose', EvoEval_concise: 'Concise' };
const substitutions = [
  ['gpt-4','GPT-4'], ['turbo','Turbo'], ['claude','Claude'], ['gemini-pro','Gemini'], ['palm','PaLM-2'],
  ['deepseek-coder','DeepSeeker'], ['code-llama','CodeLlamma'], ['chatgpt','ChatGPT'],
  ['-instruct','-Inst'], ['qwen','Qwen'], ['-python',''], ['coder','Coder'],
];
const board: Leaderboard = {
  benchmark: 'evoeval', url: 'https://evo-eval.github.io/leaderboard.html', feed,
  terms: 'Public results published by the EvoEval authors on their project site.', parts,
  aliases: {
    "Claude-3-haiku": "claude-3-haiku",
    "Claude-2": "claude-2",
    "DeepSeeker-33b": "deepseek-coder-33b",
    "DeepSeeker-6.7b": "deepseek-coder-6-7b",
    "DeepSeeker-1.3b": "deepseek-coder-1-3b",
    "CodeLlamma-70b-Inst": "codellama-70b-instruct",
    "CodeLlamma-34b-Inst": "codellama-34b-instruct",
    "StarCoder2-15b": "starcoder-2-15b",
    "StarCoder2-7b": "starcoder-2-7b",
    "StarCoder2-3b": "starcoder-2-3b",
    "Mistral-7b-Inst-v02": "mistral-7b-instruct-v0-2",
    "Gemma-7b": "gemma-7b",
    "Gemma-2b": "gemma-2b",
    "Phi-2": "phi-2",
    "Qwen-14b": "qwen-14b",
    "Qwen-7b": "qwen-7b"
},
  async fetch() {
    const data = await fetchJson<({ name: string; joint_score: number } & Record<string, unknown>)[]>(feed);
    if (data.length < 51) throw new Error('EvoEval has fewer than 51 model results');
    return data.map(row => {
      if (!row.name || !Number.isFinite(row.joint_score)) throw new Error('Incomplete EvoEval result');
      const label = substitutions.reduce((name, [from, to]) => name.replace(from, to), row.name);
      const metrics = Object.fromEntries(Object.keys(parts).map(k => {
        const value = row[k];
        if (typeof value !== 'number') throw new Error(`Missing EvoEval ${k}`);
        return [k, value * 100];
      }));
      return { model: label[0].toUpperCase() + label.slice(1), score: row.joint_score, metrics };
    });
  },
};
export default board;
