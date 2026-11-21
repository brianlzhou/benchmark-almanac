// BirdSet recognizes birds by sound. The Space sorts its Average Scores tab by AUROC, then cMAP and top-1 accuracy.
// Read the public results dataset, including each evaluation site's scores.
import type { Leaderboard } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { parquetReadObjects } from 'hyparquet';
interface Entry {
  config: { model_name: string; model_dtype: string; training_dataset: string; testing_type: string };
  results: { auroc: number; cmap: number; 't1-acc': number };
}

const FEED = "https://huggingface.co/api/datasets/DBD-research-group/Leaderboard-Results/parquet/default/train/0.parquet";
const board: Leaderboard = {
  benchmark: "birdset",
  url: "https://huggingface.co/spaces/DBD-research-group/BirdSet-Leaderboard",
  feed: FEED,
  terms: "The results dataset supplies JSON without a stated score license. Its 16 configurations use six model families. https://huggingface.co/datasets/DBD-research-group/Leaderboard-Results Hugging Face robots.txt allows the dataset.",
  parts: {},
  async fetch() {
    const all = await parquetReadObjects({ file: await fetchBytes(FEED) }) as unknown as Entry[];
    const averages = all.filter(r => r.config.testing_type === 'avg');
    if (averages.length < 16) throw new Error('Missing BirdSet average rows');
    return averages.map(({ config, results }) => {
      const model = config.model_name;
      const metrics: Record<string, number> = { cmap: results.cmap, top1: results['t1-acc'] };
      const sites = all.filter(r => r.config.model_name === model && r.config.testing_type !== 'avg');
      if (!model || sites.length < 7 || !Number.isFinite(results.auroc)) throw new Error('Incomplete BirdSet results for ' + model);
      for (const site of sites) {
        const key = site.config.testing_type;
        board.parts![key] = { name: key.toUpperCase(), group: 'Dataset' };
        metrics[key] = site.results.auroc;
        metrics[key + 'Cmap'] = site.results.cmap;
        metrics[key + 'Top1'] = site.results['t1-acc'];
      }
      if (Object.values(metrics).some(v => !Number.isFinite(v))) throw new Error('Missing BirdSet metric');
      return { model, setting: [config.training_dataset, config.model_dtype].join(', '), score: results.auroc, metrics };
    });
  },
};
export default board;
