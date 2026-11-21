// ChouBun tests Japanese long-context question answering and summarization. The dataset
// card publishes the overall score, all four task scores and each model's maximum input length.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://huggingface.co/datasets/SakanaAI/ChouBun';
const feed = url + '/raw/main/README.md';
const tasks = ['wiki_qa', 'editnet_qa', 'corp_sec_qa', 'corp_sec_sum'];
const board: Leaderboard = {
  benchmark: 'choubun', url, feed,
  terms: 'Sakana AI releases the dataset and its card under Apache 2.0. https://huggingface.co/datasets/SakanaAI/ChouBun',
  parts: Object.fromEntries(tasks.map(task => [task, task])),
  aliases: { 'mistralai/Mistral-7B-v0.1': 'mistral-7b-v0-1', 'meta-llama/Meta-Llama-3-8B': 'llama-3-8b',
    'meta-llama/Llama-2-7b-hf': 'llama-2-7b' },
  async fetch() {
    const section = (await fetchText(feed)).split('## Benchmark')[1]?.split('##')[0];
    const lines = section?.split('\n').filter(l => l.startsWith('|')).map(l => l.split('|').slice(1,-1).map(v => v.trim()));
    if (lines?.[0].slice(1).join('|') !== [...tasks, 'Overall'].join('|')) throw new Error('Missing ChouBun scores');
    return checked(lines.slice(2).map(c => {
      const model = c[0].match(/^(.+?)\s+\(\*(\d+)\*\)$/);
      if (!model) throw new Error('Missing model or input length');
      return {model: model[1], setting: 'Maximum input length ' + model[2], score: numberCell(c[5]),
        metrics: Object.fromEntries(tasks.map((t,i) => [t,numberCell(c[i+1])]))};
    }), 6);
  },
};
export default board;
