// ProteinGym's default board ranks zero-shot models by average Spearman correlation across substitution assays.
// It reads an aggregate CSV with model-level statistics and a standard error for the difference to the best score.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = 'https://proteingym.org/data/Spearman/aggregate_zero_shot_DMS_substitutions_data.csv';
const board: Leaderboard = {
  benchmark: 'proteingym', url: 'https://proteingym.org/', feed,
  terms: 'The ProteinGym project makes its aggregate leaderboard CSV publicly available.',
  async fetch() {
    const data = parseCsv(await fetchText(feed));
    if (data.length < 97 || !('Average_Spearman' in data[0])) throw new Error('Incomplete ProteinGym summary');
    const keys = Object.keys(data[0]).filter(k => /^(Function_|Taxa_|Depth_)|_MSA_depth$/.test(k));
    board.parts = Object.fromEntries(keys.map(k => [k,k.replace(/^(Function_|Taxa_)/,'').replaceAll('_',' ')]));
    return data.map(r => {
      if (!r.Model_name || !r.Average_Spearman || !Number.isFinite(Number(r.Average_Spearman))) throw new Error('Missing ProteinGym score');
      const metrics = Object.fromEntries([...keys, 'Bootstrap_standard_error_Spearman']
        .filter(k => r[k]?.trim() && Number.isFinite(Number(r[k]))).map(k => [k,Number(r[k])]));
      return { model: r.Model_name, score: Number(r.Average_Spearman), setting: 'Zero-shot DMS substitutions',
        metrics, link: r.References?.match(/href=['"]([^'"]+)['"]/)?.[1] };
    });
  },
};
export default board;
