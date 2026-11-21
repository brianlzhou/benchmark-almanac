// Tatoeba tests retrieval of English translations across 112 language pairs.
// The MTEB task API reports overall F1 and test F1 per language pair, converted here to percent.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/Tatoeba/scores';
interface Entry {
  score: number | null;
  model: { name: string; openWeights?: boolean; totalParamsB?: number; url?: string; license?: string };
  subsetScores: Record<string, { test?: number }>;
}
const board: Leaderboard = {
  benchmark: 'tatoeba-sentence-retrieval', host: 'MTEB', feed, url: 'https://leaderboard.mteb.org/tasks/Tatoeba',
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    const data = await fetchJson<{ task: { name: string; mainScore: string }; subsets: string[]; rows: Entry[] }>(feed);
    if (data.task.name !== 'Tatoeba' || data.task.mainScore !== 'f1'
      || data.subsets.length !== 112 || !data.subsets.every(pair => /^[a-z]{3}-eng$/.test(pair))) throw Error('Tatoeba task changed');
    board.parts = Object.fromEntries(data.subsets.map(pair => [pair, pair]));
    const rows = data.rows.flatMap(({ model, score, subsetScores }) => {
      if (score === null || model.name === 'mteb/baseline-random-encoder') return [];
      const metrics = Object.fromEntries(data.subsets.map(lang => {
        const value = subsetScores[lang]?.test;
        if (typeof value !== 'number' || !Number.isFinite(value)) throw Error('Missing test subset: ' + model.name + ' ' + lang);
        return [lang, value * 100];
      }));
      // Include the paper title to distinguish Meta’s encoder from Perplexity Sonar.
      const name = model.name === 'facebook/SONAR' ? 'facebook/SONAR (Sentence-Level Multimodal and Language-Agnostic Representations)' : model.name;
      return [{ model: name, score: score * 100, metrics, open: model.openWeights ?? undefined, params: model.totalParamsB ?? undefined,
        license: model.license || undefined, link: model.url || undefined }];
    });
    return checked(rows, 187);
  },
};
export default board;
