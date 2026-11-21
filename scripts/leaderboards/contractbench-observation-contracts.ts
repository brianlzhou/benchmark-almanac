// ContractBench measures whether agents preserve API observation contracts during later actions.
// The authors' README gives whole-suite success rates across 33 tasks and three trials per task.
// Its leaderboard puts two independent model and percentage pairs on each line.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://github.com/SecurityLab-UCD/ContractBench';
const feed = 'https://raw.githubusercontent.com/SecurityLab-UCD/ContractBench/HEAD/README.md';
const board: Leaderboard = {
  benchmark:'contractbench-observation-contracts',url,feed,
  terms:'MIT license at https://github.com/SecurityLab-UCD/ContractBench/blob/HEAD/LICENSE.',
  aliases:{'Qwen3.5-397B-A17B (MoE)':'qwen3-5-397b-a17b','Mistral-Small-4 (MoE)':'mistral-small-4','Gemma-4-26B-A4B (MoE)':'gemma-4-26b-a4b',
    'Qwen2.5-72B-Instruct':'qwen2-5-72b','Llama-3.3-70B-Instruct':'llama-3-3-70b-instruct'},
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === 'Model|SR%|Model|SR%');
    if (!table) throw new Error('Missing ContractBench success rates');
    return checked(table.slice(1).flatMap(c => {
      if (c.length !== 4) throw new Error('Invalid paired model row');
      return [0,2].map(i => {
        if (!c[i] || !/^\d+(?:\.\d+)?$/.test(c[i+1])) throw new Error('Missing model or success rate');
        return {model:c[i],score:Number(c[i+1]),trials:3};
      });
    }),20);
  },
};
export default board;
