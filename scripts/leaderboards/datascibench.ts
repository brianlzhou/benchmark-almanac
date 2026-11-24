// DataSciBench tests end-to-end data science. Table 2 of the ACL paper reports the final weighted score,
// combining completion rate, success rate, five fine-grained measures and visual evaluation.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://aclanthology.org/2026.findings-acl.181.pdf';
const columns = ['SR', 'CR', 'VLM', 'F1', 'F2', 'F3', 'F4', 'F5'];
const board: Leaderboard = {
  benchmark: 'datascibench', static: 'paper', url: 'https://aclanthology.org/2026.findings-acl.181/', feed,
  terms: 'ACL Anthology publishes this paper under the terms at https://aclanthology.org/2026.findings-acl.181/.',
  stats: Object.fromEntries(columns.map(key => [key, { name: key === 'SR' ? 'Success rate' : key === 'CR' ? 'Completion rate' : key,
    unit: key === 'VLM' ? 'score' : '%', better: 'higher' }])),
  aliases: { 'GPT-4o-2024-05-13': 'gpt-4o-may-2024', 'Meta-Llama-3.1-8B-Instruct': 'llama-3-1-8b', 'Meta-Llama-3-8B-Instruct': 'llama-3-8b',
    'Gemma-2-9B-it': 'gemma-2-9b', 'Yi-1.5-9B-Chat-16K': 'yi-1-5-9b-chat', 'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'DeepSeek-Coder-33B-instruct': 'deepseek-coder-33b', 'DeepSeek-Coder-6.7B-instruct': 'deepseek-coder-6-7b',
    'DeepSeek-Coder-1.3B-instruct': 'deepseek-coder-1-3b', 'Qwen2.5-Coder-7B-Instruct': 'qwen2-5-coder-7b',
    'Qwen2.5-Coder-1.5B-Instruct': 'qwen2-5-coder-1-5b' },
  async fetch() {
    const section = (await pdfText(feed)).split('Table 2: Overall evaluation results for DataSciBench')[1]?.split(/\n\s*\n\s*\n/)[0];
    if (!section?.match(/SR \(%\)\s+CR \(%\)\s+VLM\s+F1\s+F2\s+F3\s+F4\s+F5/) || !section.includes('Score')) throw new Error('DataSciBench Table 2 missing');
    const lines = section.split('API-Based Models')[1].trim().split('\n').filter(line => !/^\s*(Open-Source .* Models|Agentic Model)\s*$/.test(line));
    return checked(lines.map(line => {
      const [model, size, ...cells] = line.trim().split(/\s+/);
      if (cells.length !== 9 || !cells.every(c => /^\d+\.\d+$/.test(c))) throw new Error('Invalid Table 2 result ' + line);
      return { model: model === 'GPT-4o' ? 'GPT-4o-2024-05-13' : model, params: size === 'N/A' ? undefined : parseFloat(size), score: Number(cells[8]),
        metrics: Object.fromEntries(columns.map((key, i) => [key, Number(cells[i])])) };
    }), 26);
  },
};
export default board;
