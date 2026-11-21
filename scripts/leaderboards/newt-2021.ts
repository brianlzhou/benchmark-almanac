// BioBench reports mean image classification accuracy on NeWT. Its results JSON includes bootstrap intervals and checkpoint metadata.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Model {ckpt: string; display: string; resolution: number; params: number}
interface Result {task: string; model: string; mean: number; ci_low: number; ci_high: number; bootstrap_mean: number}

const feed = "https://imageomics.github.io/biobench/data/results.json";
const board: Leaderboard = {
  benchmark: 'newt-2021',
  url: "https://imageomics.github.io/biobench/",
  feed,
  terms: "The site has no robots file. The repository uses the MIT license. Select the newt rows. The JSON stores accuracy as a fraction and averages across test images. https://github.com/Imageomics/biobench/blob/main/LICENSE",
  host: 'BioBench',
  stats: {
    resolution: { name: 'Image resolution', unit: 'count', note: 'Input image resolution in pixels.' },
    bootstrapMean: { name: 'Bootstrap mean accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const data = await fetchJson<{models: Model[]; results: Result[]}>(feed);
    const models = new Map(data.models.map(m => [m.ckpt, m]));
    const results = data.results.filter(r => r.task === 'newt');
    if (results.length < 84) throw new Error('Incomplete NeWT results');
    return results.map(r => {
      const m = models.get(r.model);
      if (!m?.display || ![r.mean, r.ci_low, r.ci_high, r.bootstrap_mean].every(Number.isFinite)) throw new Error('Invalid NeWT result');
      return { model: m.display, setting: m.ckpt, score: r.mean * 100, low: r.ci_low * 100, high: r.ci_high * 100, params: m.params / 1e9,
        metrics: { resolution: m.resolution, bootstrapMean: r.bootstrap_mean * 100 } };
    });
  },
};
export default board;
