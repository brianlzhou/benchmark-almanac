// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Tables 3 and 4 measure whether a multimodal judge agrees with all human criteria on a prompt.
import type { BoardPart, Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://openaccess.thecvf.com/content/CVPR2026/papers/Xiong_Multi-Crit_Benchmarking_Multimodal_Judges_on_Pluralistic_Criteria-Following_CVPR_2026_paper.pdf';
const common = ['Pluralistic', 'Conflict', 'Tradeoff'];
const sections = [
  { group: 'Open-ended', caption: 'Table 3. Results on open-ended split', criteria: ['Completeness', 'Grounding', 'Hallucination', 'Expressiveness', 'Clarity'] },
  { group: 'Verifiable reasoning', caption: 'Table 4. Results on verifiable reasoning', criteria: ['Grounding', 'Logic', 'Hallucination', 'Exploration', 'Efficiency'] },
];
const parts: Record<string, BoardPart> = {};
for (const { group, criteria } of sections) {
  for (const name of [...common, ...criteria, 'Avg']) parts[group + ': ' + name] = { group, name };
}
const board: Leaderboard = {
  benchmark: 'multi-crit', url: 'https://multi-crit.github.io/', feed, static: 'paper', parts,
  headline: 'This is the plain mean of pluralistic accuracy on open-ended and verifiable reasoning prompts.',
  aliases: { 'Llama-3.2-11B-Vision-Instruct': 'llama-3-2-11b', 'MiniCPM-V-4.5-8B': 'minicpm-v-4-5',
    'InternVL3-8B-Instruct': 'internvl3-8b', 'InternVL3-78B-Instruct': 'internvl3-78b',
    'Qwen2.5-VL-7B-Instruct': 'qwen2-5-vl-7b', 'Qwen2.5-VL-72B-Instruct': 'qwen2-5-vl-72b' },
  terms: 'CVF publishes the authors’ conference paper under its open-access terms at https://openaccess.thecvf.com/menu.',
  async fetch() {
    const paper = await pdfText(feed);
    const results = new Map<string, Record<string, number>>();
    for (const { group, caption, criteria } of sections) {
      const end = paper.indexOf(caption);
      const block = paper.slice(paper.lastIndexOf('\f', end), end);
      const columns = [...common, ...criteria, 'Avg'];
      if (end < 0 || !block.replace(/\s+/g, ' ').includes(['Pluralisic', ...columns.slice(1)].join(' '))) {
        throw new Error('Missing Multi-Crit columns for ' + group);
      }
      for (const row of block.matchAll(/^\s*(\S[^\n]*?)\s+((?:\d+\.\d+[ \t]+){8}\d+\.\d+)[ \t]*$/gm)) {
        const model = row[1].trim().replace(/\s*\([^)]+\)$/, '').replace(/^R1-Reward$/, 'R1-Reward-7B');
        const metrics = results.get(model) ?? {};
        if (group + ': Pluralistic' in metrics) throw new Error('Duplicate scores for ' + model);
        row[2].trim().split(/\s+/).forEach((v, i) => { metrics[group + ': ' + columns[i]] = numberCell(v); });
        results.set(model, metrics);
      }
    }
    return checked([...results].map(([model, metrics]) => ({
      model, metrics, score: (metrics['Open-ended: Pluralistic'] + metrics['Verifiable reasoning: Pluralistic']) / 2,
    })), 25);
  },
};
export default board;
