// NaijaSenti tests sentiment classification in four Nigerian languages.
// MTEB's task feed gives overall accuracy and per-language test accuracy as fractions.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/NaijaSenti/scores';
const parts = { hau: 'Hausa', ibo: 'Igbo', pcm: 'Nigerian Pidgin', yor: 'Yoruba' };
interface Entry {
  model: { name: string; url: string; totalParamsB?: number; openWeights?: boolean; license?: string };
  score: number;
  subsetScores: Record<string, { test: number }>;
}
function percent(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Invalid MTEB accuracy');
  return value * 100;
}
const board: Leaderboard = {
  benchmark: 'naijasenti', host: 'MTEB', url: 'https://leaderboard.mteb.org/tasks/NaijaSenti', feed, parts,
  terms: 'MTEB publishes the results under CC0 1.0 at https://huggingface.co/datasets/mteb/results.',
  aliases: { 'Qwen/Qwen3-Embedding-8B': 'qwen3-embedding-8b' },
  async fetch() {
    const data = await fetchJson<{task: {name: string; mainScore: string}; rows: Entry[]}>(feed);
    if (data.task.name !== 'NaijaSenti' || data.task.mainScore !== 'accuracy') throw new Error('MTEB task or metric changed');
    const rows = data.rows.filter(r => r.model.name !== 'mteb/baseline-random-encoder').map(({model, score, subsetScores}) => ({
      model: model.name, link: model.url, params: model.totalParamsB, open: model.openWeights, license: model.license,
      score: percent(score), metrics: Object.fromEntries(Object.keys(parts).map(k => [k, percent(subsetScores[k]?.test)])),
    }));
    return checked(rows, 20);
  },
};
export default board;
