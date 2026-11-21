// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Tables 3 and 4 report the judge's unsafe-response rate on two datasets for each model and evaluation setting.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://proceedings.neurips.cc/paper_files/paper/2024/file/38c1dfb4f7625907b15e9515365e7803-Paper-Datasets_and_Benchmarks_Track.pdf';
const board: Leaderboard = {
  benchmark: 'jailtrickbench', url: feed, feed, static: 'paper',
  terms: 'NeurIPS publishes this paper under the terms listed at https://proceedings.neurips.cc/.',
  headline: 'The headline is the plain mean of the judge-assessed attack success rates on AdvBench and MaliciousInstruct.',
  parts: { AdvBench: 'AdvBench', MaliciousInstruct: 'MaliciousInstruct' },
  async fetch() {
    const pdf = await pdfText(feed);
    const groups = new Map<string, { model: string; setting: string; metrics: Record<string, number> }>();
    for (const dataset of ['AdvBench', 'MaliciousInstruct']) {
      const start = pdf.indexOf('Jailbreak attack experiments on dataset ' + dataset + ' under ASRAgent');
      const table = pdf.slice(start).split(/\n\s*\n/)[0].split('\n');
      if (start < 0 || !table[1]?.includes('Defense Methods')) throw new Error('Missing agent-evaluated dataset table');
      const defenses = table[1].trim().split(/\s{2,}/).slice(1).map(s => s.replace('↑', ''));
      if (defenses.length !== 7) throw new Error('Defense columns changed');
      let model = '';
      for (const line of table.slice(2)) {
        const cells = line.trim().split(/\s{2,}/);
        if (cells.length === 1) { model = cells[0] === 'LLaMA-2-7B' ? 'Llama-2-7B-chat-hf' : cells[0] === 'Vicuna-13B' ? 'Vicuna-13B-v1.5' : cells[0]; continue; }
        if (!model || cells.length !== defenses.length + 1) throw new Error('Unexpected result row');
        defenses.forEach((defense, i) => {
          const setting = cells[0].replace(/ \[\d+\]$/, '') + ', ' + defense;
          const key = model + '|' + setting;
          const group = groups.get(key) ?? { model, setting, metrics: {} as Record<string, number> };
          group.metrics[dataset] = Number(cells[i + 1]);
          groups.set(key, group);
        });
      }
    }
    return checked([...groups.values()].map(r => ({ ...r, score: (r.metrics.AdvBench + r.metrics.MaliciousInstruct) / 2 })), 98);
  },
};
export default board;
