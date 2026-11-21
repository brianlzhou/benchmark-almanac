// Nejumi v1 evaluates Japanese language understanding with JGLUE. Its public W&B project stores one table per run.
// The first score is MARC-ja accuracy. Later columns include correlations and question-answering scores.
// These are the latest public runs of each model with the same original eight-column schema.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://api.wandb.ai/files/wandb/LLM_evaluation_Japan_public/';
const files = [
  'jo89zv46/media/table/result_table_15086_304f473fdba86e853483.table.json',
  '3frd9vfr/media/table/result_table_15086_56411e2a7268f7ffa04e.table.json',
];
const columns = ['MARC-ja', 'JSTS-pearson', 'JSTS-spearman', 'JNLI', 'JSQuAD-EM', 'JSQuAD-F1', 'JCommonsenseQA'];
const parts: Record<string, BoardPart> = Object.fromEntries(columns.map(k => [k, { name: k, unit: 'score' }]));
const board: Leaderboard = {
  benchmark: 'nejumi-llm-leaderboard', url: 'https://wandb.ai/wandb/LLM_evaluation_Japan_public', feed: feed + files[0], parts,
  headline: 'The board reports no overall score, so the headline is its first column, MARC-ja accuracy.',
  terms: 'W&B publishes these runs in the public project. https://wandb.ai/terms',
  async fetch() {
    const rows = [];
    for (const path of files) {
      if (rows.length) await new Promise(resolve => setTimeout(resolve, 1050));
      const table = await fetchJson<{ columns: string[]; data: [string, ...number[]][] }>(feed + path);
      if (table.columns.map(c => c.trim()).join('|') !== ['model_name', ...columns].join('|') || table.data.length !== 1) throw new Error('Changed run table');
      const [model, ...values] = table.data[0];
      if (values.length !== columns.length || !values.every(Number.isFinite)) throw new Error('Invalid JGLUE values');
      rows.push({ model, score: values[0], metrics: Object.fromEntries(columns.map((key, i) => [key, values[i]])), link: feed + path });
    }
    return checked(rows, 2);
  },
};
export default board;
