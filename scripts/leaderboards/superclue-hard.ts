// SuperCLUE-Hard is SuperCLUE's Chinese high-challenge language benchmark.
// The headline is the December 2024 report's Hard score on a 0 to 100 scale.
// This importer reads the fixed ranking table transcribed from the official annual report PDF.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const scores: [string, number][] = [
  ['o1', 76.7], ['o1-preview', 63.6], ['ChatGPT-4o-latest', 57.8], ['Gemini-2.0-Flash-Exp', 55.5],
  ['DeepSeek-V3', 54.8], ['Claude 3.5 Sonnet(20241022)', 54.6], ['SenseChat 5.5-latest', 51.5], ['360zhinao2-o1', 51.5],
  ['Qwen-max-latest', 51.5], ['Doubao-pro-32k-241215', 51.5], ['Step-2-16k', 50.0], ['Qwen2.5-72B-Instruct', 49.7],
  ['Grok-2-1212', 49.2], ['NebulaCoder-V5', 48.6], ['GLM-4-Plus', 48.6], ['ERNIE-4.0-Turbo-8K-Latest', 45.6],
  ['Baichuan4', 45.6], ['DeepSeek-V2.5', 45.3], ['Sky-Chat-3.0', 44.5], ['kimi', 44.5], ['TeleChat2-Large', 43.3],
  ['MiniMax-abab7-preview', 43.3], ['GPT-4o-mini', 42.8], ['Llama-3.3-70B-Instruct', 38.8], ['Hunyuan-Turbo', 38.6],
  ['TeleChat2-35B', 38.6], ['Qwen2.5-7B-Instruct', 35.7], ['GLM-4-9B-Chat', 31.6], ['QwQ-32B-Preview', 26.6],
  ['Gemma-2-9b-it', 22.7], ['Llama-3.1-8B-Instruct', 20.9], ['Yi-1.5-34B-Chat-16K', 20.6], ['Yi-1.5-9B-Chat-16K', 20.6],
  ['讯飞星火V4.0', 20.6], ['Qwen2.5-3B-Instruct', 18.6], ['360Zhinao2-7B-Chat-4K', 17.5], ['Phi-3.5-Mini-Instruct', 14.0],
  ['MiniCPM3-4B', 13.7], ['Gemma-2-2b-it', 11.8], ['Mistral-7B-Instruct-v0.3', 11.8],
];

const board: Leaderboard = {
  benchmark: 'superclue-hard',
  url: 'https://www.cluebenchmarks.com/superclue_2024',
  feed: 'https://www.cluebenchmarks.com/superclue_2024 (SuperCLUE-Hard成绩 table in the PDF)',
  terms: 'SuperCLUE publishes the annual report PDF without a stated reuse license. Results are credited to the SuperCLUE team.',
  static: 'paper',
  fetch: async () => scores.map(([model, score]) => ({ model, score } as LeaderboardRow)),
};
export default board;
