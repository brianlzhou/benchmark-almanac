// PartAI ranks Persian language models by the mean of five accuracy columns. The Space reads one JSON line per model and precision.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";

const board: Leaderboard = {
  benchmark: "open-persian-llm-leaderboard",
  url: "https://huggingface.co/spaces/PartAI/open-persian-llm-leaderboard",
  feed: "https://huggingface.co/spaces/PartAI/open-persian-llm-leaderboard/raw/main/leaderboard_data.jsonl",
  terms: "The Space declares Apache 2.0. Model licenses appear separately in the results. https://huggingface.co/spaces/PartAI/open-persian-llm-leaderboard/blob/main/README.md Hugging Face allows the feed in robots.txt.",
  aliases: {
    'meta-llama/Llama-3.2-1B-Instruct':'llama-3-2-1b', 'meta-llama/Llama-3.1-8B-Instruct':'llama-3-1-8b',
    'meta-llama/Meta-Llama-3-8B-Instruct':'llama-3-8b', 'Qwen/Qwen2.5-7B-Instruct':'qwen2-5-7b',
    'Qwen/Qwen2.5-32B-Instruct':'qwen2-5-32b', 'google/gemma-2-9b-it':'gemma-2-9b', 'google/gemma-2-27b-it':'gemma-2-27b',
  },
  async fetch() {
    const lines = (await fetchText(this.feed)).trim().split(/\r?\n/);
    const keys = ['Part Multiple Choice','ARC Easy','ARC Challenge','MMLU Pro','AUT Multiple Choice Persian'];
    this.parts = Object.fromEntries(keys.map(k=>[k,k]));
    if (lines.length < 31) throw new Error('Missing Persian leaderboard rows');
    return lines.map(line => {
      const r = JSON.parse(line);
      if (!r.Model || !keys.every(k=>Number.isFinite(r[k]))) throw new Error('Missing Persian accuracy column');
      return {model:r.Model,score:keys.reduce((sum,k)=>sum+r[k],0)/keys.length,setting:r.Precision,params:r['#Params (B)'],license:r['Hub License'],link:'https://huggingface.co/'+r.Model,metrics:Object.fromEntries(keys.map(k=>[k,r[k]]))};
    });
  },
};
export default board;
