// LLM Uncertainty Bench measures accuracy and uncertainty across five multiple-choice language tasks.
// The authors' README reports mean accuracy, mean prediction set size and uncertainty-aware accuracy for base models.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://github.com/smartyfh/LLM-Uncertainty-Bench';
const feed = 'https://raw.githubusercontent.com/smartyfh/LLM-Uncertainty-Bench/HEAD/README.md';
const tasks = ['QA', 'RC', 'CI', 'DRS', 'DS'];
const board: Leaderboard = {
  benchmark: 'llm-uncertainty-bench', url, feed,
  aliases: { 'DeepSeek-67B': 'deepseek-llm-67b' },
  terms: 'The authors license the repository under MIT. https://github.com/smartyfh/LLM-Uncertainty-Bench/blob/main/LICENSE',
  parts: { QA: 'Question Answering', RC: 'Reading Comprehension', CI: 'Commonsense Inference',
    DRS: 'Dialogue Response Selection', DS: 'Document Summarization' },
  async fetch() {
    const section = (await fetchText(feed)).split('### Pretrained Base LLMs')[1]?.split('### Instruction-Finetuned Chat LLMs')[0];
    if (!section) throw new Error('Missing base model results');
    const blocks = section.match(/^\| LLMs \| QA \| RC \| CI \| DRS \| DS \| Avg\. \|\s*\n(?:\|[^\n]*\n)+/gm);
    if (blocks?.length !== 3) throw new Error('Expected accuracy, prediction set size and UAcc tables');
    const tables = blocks.map(block => new Map(block.trim().split('\n').slice(2).map(line => {
      const [model, ...cells] = line.trim().slice(1, -1).split('|').map(s => s.trim());
      if (cells.length !== 6) throw new Error('Incomplete base model row');
      return [model, cells.map(numberCell)];
    })));
    return checked([...tables[0]].map(([model, accuracy]) => {
      const size = tables[1].get(model);
      const uacc = tables[2].get(model);
      if (!size || !uacc) throw new Error('Missing uncertainty results for ' + model);
      const metrics: Record<string, number> = { meanSetSize: size[5], uncertaintyAwareAccuracy: uacc[5] };
      tasks.forEach((task, i) => {
        metrics[task] = accuracy[i];
        metrics[task + 'SetSize'] = size[i];
        metrics[task + 'UAcc'] = uacc[i];
      });
      return { model, score: accuracy[5], metrics };
    }), 16);
  },
};
export default board;
