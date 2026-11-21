// AnalogCoder-Pro tests automatic analog circuit generation and optimization.
// Table IV reports Pass@1 and Pass@5 averaged over 30 circuit tasks for seven language models.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.repository.cam.ac.uk/bitstreams/346885c7-a7f7-4560-8f77-9ade6e923408/download';
const models = ['Qwen-2.5-Coder-32B', 'GPT-4.1-nano', 'Gemini-2.5-Flash', 'DeepSeek-V3', 'GPT-4.1', 'Claude-3.7-Sonnet', 'GPT-5'];
const analogParts = Object.fromEntries(Array.from({ length: 29 }, (_, i) => [`task${i + 1}PassAt5`, `Task ${i + 1} pass@5`]));
const board: Leaderboard = {
  benchmark: 'analogcoder-pro', feed, url: 'https://doi.org/10.1109/TCAD.2026.3673493', static: 'paper',
  terms: 'The University of Cambridge hosts the authors’ manuscript. https://www.repository.cam.ac.uk/handle/1810/400930',
  parts: analogParts,
  stats: { passAt5: { name: 'Pass at 5', unit: '%', better: 'higher' }, solved: { name: 'Solved tasks', unit: 'count' } },
  aliases: { 'Qwen-2.5-Coder-32B': 'qwen2-5-coder-32b' },
  async fetch() {
    const paper = await pdfText(feed);
    const section = paper.split('TABLE IV Main results.')[1]?.split('TABLE V Ablation')[0];
    const avg = section?.match(/^\s*Avg\s+([\d. ]+)$/m)?.[1].trim().split(/\s+/).map(Number);
    if (!avg || avg.length !== 14 || !avg.every(Number.isFinite)) throw new Error('Missing AnalogCoder-Pro average row');
    if (!models.every((name, i) => section!.split('Circuit Type')[0].split(/Model\s+/).at(-1)?.trim().split(/\s{2,}/)[i] === name)) throw new Error('Changed model columns');
    const solved = section!.match(/^\s*# Solved\s+([\d ]+)$/m)?.[1].trim().split(/\s+/).map(Number);
    if (solved?.length !== 14) throw new Error('Missing solved counts');
    const parts: Record<string, string> = {};
    const perModel = models.map((): Record<string, number> => ({}));
    for (const line of section!.split('# Solved')[0].split('\n')) {
      const task = line.match(/^\s*(\d+)\s+([A-Za-z ]+?)\s{2,}([\d. ]+)$/);
      if (!task) continue;
      const values = task[3].trim().split(/\s+/).map(Number);
      if (values.length !== 14 || !values.every(Number.isFinite)) throw new Error('Invalid circuit scores');
      const key = 'task' + task[1];
      parts[key] = 'Task ' + task[1] + ': ' + task[2].trim();
      perModel.forEach((metrics, i) => {
        metrics[key] = values[2 * i];
        metrics[key + 'PassAt5'] = values[2 * i + 1];
      });
    }
    if (Object.keys(parts).length !== 30) throw new Error('Incomplete 30-circuit table');
    board.parts = parts;
    return checked(models.map((model, i) => ({ model, score: avg[i * 2], harness: 'AnalogCoder-Pro',
      metrics: { ...perModel[i], passAt5: avg[i * 2 + 1], solved: solved[i * 2] }, trials: 30 })), 7);
  },
};
export default board;
