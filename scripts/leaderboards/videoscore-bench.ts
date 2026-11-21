// VideoScore-Bench compares video evaluators with human judgments across four test sets.
// The project page ranks methods by Final Avg Score and publishes each test set's score in the same table.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const url = "https://tiger-ai-lab.github.io/VideoScore/";
const feed = url;

const board: Leaderboard = {
  benchmark: 'videoscore-bench', url, feed,
  terms: "The project page states no separate terms for scores. The GitHub Pages host provides no applicable robots rules.",
  // The June 2024 paper reports these API scores. The authors' Gemini scripts used the latest versions then.
  // The authors' Idefics and LLaVA readers identify their default checkpoints.
  aliases: { 'GPT-4o': 'gpt-4o-may-2024', 'Gemini-1.5-Pro': 'gemini-1-5-pro-may-2024',
    'Gemini-1.5-Flash': 'gemini-1-5-flash-may-2024', 'LLaVA-1.5-7B': 'llava-v1-5-7b',
    'LLaVA-1.6-7B': 'llava-v1-6-vicuna-7b', Idefics1: 'idefics-9b-instruct' },
  parts: { feedback: 'VideoFeedback-test', evalcrafter: 'EvalCrafter', genai: 'GenAI-Bench', vbench: 'VBench' },
  async fetch() {
    const table = tables((await fetchText(feed)).replace(/<!--[\s\S]*?-->/g, '')).find(t => t[0]?.map(c => c.text).join('|') === 'Metric|Final Avg Score ↓|VideoFeedback-test|EvalCrafter|GenAI-Bench|VBench');
    if (!table || table.length < 18) throw new Error('Incomplete VideoScore-Bench ranking');
    return table.slice(1).map(c => {
      if (!c[0].text || c.length !== 6 || c.slice(1).some(x => !/^-?\d+(\.\d+)?$/.test(x.text))) throw new Error('Invalid evaluator row');
      const [score, feedback, evalcrafter, genai, vbench] = c.slice(1).map(x => Number(x.text));
      return { model: c[0].text, score, metrics: { feedback, evalcrafter, genai, vbench } };
    });
  },
};
export default board;
