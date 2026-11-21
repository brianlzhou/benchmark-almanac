// The source reports no overall score. The headline is the plain mean of the 15 parts, computed by this importer.
// OpenCompass evaluates academic reasoning, knowledge and coding. Its Full Version matrix reports percentages.
// The Space joins matrix columns to display names using its model metadata.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const base = 'https://opencompass.oss-cn-shanghai.aliyuncs.com/dev-assets/hf-research/';
const feed = base + 'hf-academic.json';
const names = ['IFEval', 'BBH', 'GPQA_diamond', 'Math-500', 'AIME2024', 'MMLU-Pro', 'LiveCodeBench',
  'HumanEval', 'Drop', 'Hellaswag', 'MUSR', 'KorBench', 'CMMLU', 'MMLU', 'BigCodeBench'];
const board: Leaderboard = {
  benchmark: 'compass-academic-leaderboard', url: 'https://huggingface.co/spaces/opencompass/CompassAcademic-Leaderboard-Full-Version',
  feed, terms: 'The Space declares Apache 2.0. https://huggingface.co/spaces/opencompass/CompassAcademic-Leaderboard-Full-Version/blob/main/README.md',
  aliases: {
    'DeepSeek-V3': 'deepseek-v3', 'Gemma-2-27B-it': 'gemma-2-27b', 'Gemma-2-9B-it': 'gemma-2-9b',
    'Llama3.1-8B-Instruct': 'llama-3-1-8b', 'Llama3.2-3B-Instruct': 'llama-3-2-3b',
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b', 'Qwen2.5-14B-Instruct': 'qwen2-5-14b', 'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
  },
  parts: Object.fromEntries(names.map(name => [name, { name, unit: '%' }])),
  async fetch() {
    const matrix = await fetchJson<Record<string, Record<string, string>>>(feed);
    if (Object.keys(matrix).length !== names.length || !names.every(name => matrix[name]?.metric))
      throw new Error('OpenCompass academic benchmark columns changed');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const models = await fetchJson<{ abbr: string, display_name: string, num_param: string, release_type: string }[]>(base + 'model-meta-info.json');
    const rows: LeaderboardRow[] = [];
    for (const { abbr, display_name, num_param, release_type } of models) {
      const cells = names.map(name => matrix[name][abbr]);
      if (cells.some(value => value === '-')) continue;
      if (!cells.every(value => /^\d+(?:\.\d+)?$/.test(value) && Number(value) <= 100))
        throw new Error('Invalid model column: ' + abbr);
      const metrics = Object.fromEntries(names.map((name, i) => [name, Number(cells[i])]));
      rows.push({ model: display_name, params: /^\d+(?:\.\d+)?B$/.test(num_param) ? parseFloat(num_param) : undefined,
        open: release_type === 'OpenSource' ? true : undefined, score: Object.values(metrics).reduce((a, b) => a + b, 0) / names.length, metrics });
    }
    checked(rows.map(row => ({ ...row })), 16);
    return rows;
  },
};
export default board;
