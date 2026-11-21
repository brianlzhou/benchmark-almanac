// MultiEURLEX tests multi-label classification of European Union laws. MTEB scores accuracy for 21 EuroVoc concepts.
// The headline is the MTEB score for models with results in all 23 languages, on the board's 0 to 1 scale.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const task = 'MultiEURLEXMultilabelClassification';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/' + task + '/scores';
const languages = 'bg cs da de el en es et fi fr hr hu it lt lv mt nl pl pt ro sk sl sv'.split(' ');
interface Run {
  model: { name: string, url?: string, totalParamsB?: number, openWeights?: boolean, license?: string };
  score: number;
  subsetScores: Record<string, { test?: number }>;
}
const names = new Intl.DisplayNames('en', { type: 'language' });
const board: Leaderboard = {
  benchmark: 'multieurlex', host: 'MTEB', feed, url: 'https://leaderboard.mteb.org/tasks/' + task,
  terms: 'MTEB releases results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  parts: Object.fromEntries(languages.map(l => [l, names.of(l)!])),
  async fetch() {
    const data = await fetchJson<{ task: { name: string, mainScore: string }, rows: Run[] }>(feed);
    if (data.task.name !== task || data.task.mainScore !== 'accuracy') throw Error('Missing MultiEURLEX accuracy');
    const complete = data.rows.filter(r => r.model.name !== 'mteb/baseline-random-encoder' &&
      languages.every(l => Number.isFinite(r.subsetScores[l]?.test)));
    return checked(complete.map(({ model, score, subsetScores }) => ({
      model: model.name, score, link: model.url, open: model.openWeights, license: model.license || undefined,
      params: model.totalParamsB ?? undefined, metrics: Object.fromEntries(languages.map(l => [l, subsetScores[l].test!])),
    })), 178);
  },
};
export default board;
