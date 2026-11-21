// BirdSet recognizes birds by sound. The Space sorts its Average Scores tab by AUROC, then cMAP and top-1 accuracy.
// Read the public results dataset, including each evaluation site's scores.
import type { Leaderboard, BoardStat } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { parquetReadObjects } from 'hyparquet';
interface Entry {
  config: { model_name: string; model_dtype: string; training_dataset: string; testing_type: string };
  results: { auroc: number; cmap: number; 't1-acc': number };
}

const FEED = "https://huggingface.co/api/datasets/DBD-research-group/Leaderboard-Results/parquet/default/train/0.parquet";
const fraction = (name: string): BoardStat => ({ name, unit: 'score', better: 'higher', note: 'Stored as a fraction from 0 to 1.' });
const board: Leaderboard = {
  benchmark: "birdset",
  url: "https://huggingface.co/spaces/DBD-research-group/BirdSet-Leaderboard",
  feed: FEED,
  terms: "The results dataset supplies JSON without a stated score license. Its 16 configurations use six model families. https://huggingface.co/datasets/DBD-research-group/Leaderboard-Results Hugging Face robots.txt allows the dataset.",
  stats: {
    cmap: fraction('cMAP'), top1: fraction('Top-1 accuracy'),
    hsn: fraction('High Sierras AUROC'), hsnCmap: fraction('High Sierras cMAP'), hsnTop1: fraction('High Sierras top-1 accuracy'),
    nbp: fraction('NIPS4BPlus AUROC'), nbpCmap: fraction('NIPS4BPlus cMAP'), nbpTop1: fraction('NIPS4BPlus top-1 accuracy'),
    nes: fraction('Colombia Costa Rica AUROC'), nesCmap: fraction('Colombia Costa Rica cMAP'), nesTop1: fraction('Colombia Costa Rica top-1 accuracy'),
    per: fraction('Amazon Basin AUROC'), perCmap: fraction('Amazon Basin cMAP'), perTop1: fraction('Amazon Basin top-1 accuracy'),
    sne: fraction('Sierra Nevada AUROC'), sneCmap: fraction('Sierra Nevada cMAP'), sneTop1: fraction('Sierra Nevada top-1 accuracy'),
    ssw: fraction('Sapsucker Woods AUROC'), sswCmap: fraction('Sapsucker Woods cMAP'), sswTop1: fraction('Sapsucker Woods top-1 accuracy'),
    uhh: fraction('Hawaiian Islands AUROC'), uhhCmap: fraction('Hawaiian Islands cMAP'), uhhTop1: fraction('Hawaiian Islands top-1 accuracy'),
  },
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
