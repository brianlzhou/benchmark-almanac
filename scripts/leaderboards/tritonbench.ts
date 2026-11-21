// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Tables 3 and 4 report execution accuracy for TritonBench-G and TritonBench-T with zero-shot and one-shot prompts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2502.14752';
const names: Record<string,string> = {'GPT-4o': 'GPT-4o-0806', 'Claude-3.5-Sonnet': 'Claude-3.5-Sonnet-0620', 'GPT-o1': 'GPT-o1-2024-12-17',
  'Qwen2.5-Coder': 'Qwen2.5-Coder-7B-Instruct', 'DeepSeek-Coder': 'deepseek-coder-6.7b-instruct', 'Qwen2.5-72B': 'qwen2.5-72B-Instruct'};
const board: Leaderboard = {
  benchmark: 'tritonbench', static: 'paper', url: feed, feed,
  terms: 'The authors publish Tables 3 and 4 under the license on the arXiv record. https://arxiv.org/abs/2502.14752',
  parts: {G: 'TritonBench-G', T: 'TritonBench-T'},
  aliases: {'GPT-4o-0806':'gpt-4o-aug-2024','Claude-3.5-Sonnet-0620':'claude-3-5-sonnet','GPT-o1-2024-12-17':'o1','DeepSeek-R1 (snapshot unspecified)':'deepseek-r1'},
  headline: 'The paper reports no overall score, so this is the plain mean of execution accuracy on TritonBench-G and TritonBench-T.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const results = new Map<string, LeaderboardRow>();
    for (const [part, columns] of [['G',['Similarity','Call Accuracy','Execution Accuracy','Speed Up','GPU Efficiency']],['T',['Call Accuracy','Execution Accuracy','Speed Up']]] as const) {
      const table = tables.find(t => t[0]?.join('|') === ['Model','Size',...columns].join('|'));
      if (!table) throw new Error('Missing TritonBench-' + part + ' comparison');
      for (const [label, size, ...scores] of table.slice(1)) {
        if (label === size) continue;
        const model = names[label] ?? label;
        const values = scores.map(cell => cell.split(' / ').map(numberCell));
        if (values.length !== columns.length || values.some(v => v.length !== 2)) throw new Error('Changed TritonBench metrics');
        ['Zero-shot','One-shot'].forEach((setting, i) => {
          const key = model + '/' + setting;
          const row = results.get(key) ?? {model, setting, score: 0, metrics: {}, params: size === '-' ? undefined : Number.parseFloat(size)};
          for (const [j, column] of columns.entries()) {
            const metric = column === 'Execution Accuracy' ? part : part + ' ' + column;
            row.metrics![metric] = values[j][i];
          }
          results.set(key, row);
        });
      }
    }
    const rows = [...results.values()];
    rows.forEach(r => {r.score = (r.metrics!.G + r.metrics!.T) / 2;});
    return checked(rows, 18);
  },
};
export default board;
