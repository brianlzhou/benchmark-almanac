// BIBLE measures full-set multiple-choice accuracy. The Hugging Face dataset card reports Q4_K_M results.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://huggingface.co/datasets/MushroomGecko/BIBLE/raw/main/README.md";
const board: Leaderboard = {
  benchmark: "biblically-informed-bot-learning-evaluation",
  url: "https://huggingface.co/datasets/MushroomGecko/BIBLE#%F0%9F%93%8A-model-accuracy-on-bible-benchmark",
  feed: FEED,
  terms: "The maker lists CC BY 4.0 and asks users to respect source terms. https://huggingface.co/datasets/MushroomGecko/BIBLE Hugging Face robots.txt allows the dataset.",
  aliases: {"Gemma 2 2b Instruct": "gemma-2-2b-it", "Gemma 3 4b Instruct": "gemma-3-4b", "Gemma 3 1b Instruct": "gemma-3-1b", "Granite 3.1 Dense 2b Instruct": "granite-3-1-2b-instruct", "Granite 3.1 MoE 1b Instruct": "granite-3-1-1b-a400m-instruct", "Phi4-mini Instruct": "phi-4-mini"},
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0].join('|') === 'Model Name|Total Accuracy');
    if (!table || table.length < 28) throw new Error('Missing BIBLE accuracy rows');
    return table.slice(1).map(([model, result]) => {
      if (!model || !/^\d+(\.\d+)?%$/.test(result)) throw new Error('Invalid BIBLE result for ' + model);
      return { model, score: parseFloat(result), setting: 'Q4_K_M' };
    });
  },
};
export default board;
