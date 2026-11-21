// SemRel2024 measures agreement with human rankings of sentence relatedness across languages.
// The MTEB task API publishes an overall cosine Spearman correlation and test correlations for twelve languages.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/SemRel24STS/scores';
const parts = { afr: 'Afrikaans', amh: 'Amharic', arb: 'Standard Arabic', arq: 'Algerian Arabic', ary: 'Moroccan Arabic',
  eng: 'English', hau: 'Hausa', hin: 'Hindi', ind: 'Indonesian', kin: 'Kinyarwanda', mar: 'Marathi', tel: 'Telugu' };
interface Entry {
  score: number | null;
  model: { name: string; openWeights?: boolean; totalParamsB?: number; url?: string; license?: string };
  subsetScores: Record<string, { test?: number }>;
}
const board: Leaderboard = {
  benchmark: 'semeval-2024-task-1-semantic-textual-relatedness', host: 'MTEB', feed, url: 'https://leaderboard.mteb.org/tasks/SemRel24STS',
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  parts,
  async fetch() {
    const data = await fetchJson<{ task: { name: string; mainScore: string }; subsets: string[]; rows: Entry[] }>(feed);
    if (data.task.name !== 'SemRel24STS' || data.task.mainScore !== 'cosine_spearman'
      || data.subsets.slice().sort().join('|') !== Object.keys(parts).sort().join('|')) throw Error('SemRel24STS task changed');
    const rows = data.rows.flatMap(({ model, score, subsetScores }) => {
      if (score === null || model.name === 'mteb/baseline-random-encoder') return [];
      const metrics = Object.fromEntries(Object.keys(parts).map(lang => {
        const value = subsetScores[lang]?.test;
        if (typeof value !== 'number' || !Number.isFinite(value)) throw Error('Missing test subset: ' + model.name + ' ' + lang);
        return [lang, value];
      }));
      return [{ model: model.name, score, metrics, open: model.openWeights ?? undefined, params: model.totalParamsB ?? undefined,
        license: model.license || undefined, link: model.url || undefined }];
    });
    return checked(rows, 193);
  },
};
export default board;
