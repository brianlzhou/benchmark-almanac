// DTD classifies photographs into 47 texture attributes. Table 2 reports linear
// SVM accuracy and mean average precision over ten train-validation-test splits.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://openaccess.thecvf.com/content_cvpr_2014/papers/Cimpoi_Describing_Textures_in_2014_CVPR_paper.pdf';
export default {
  benchmark: 'describable-textures-dataset', url: feed, feed, static: 'paper',
  terms: 'CVF Open Access, copyright retained by the authors or rights holders. https://openaccess.thecvf.com/',
  parts: { mAP: { name: 'Mean average precision', unit: '%' } },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 2: Comparison of encodings')[0].split('\f').at(-1)!;
    if (!/IFV\s+BoVW\s+VLAD\s+LLC\s+KCB/.test(table) || !table.includes('DeCAF')) {
      throw new Error('Missing Table 2 encoding columns');
    }
    function values(label: RegExp) {
      const line = table.split('\n').find(line => label.test(line));
      const pairs = [...(line ?? '').matchAll(/(\d+\.\d+)±(\d+\.\d+)/g)];
      if (pairs.length !== 7) throw new Error('Missing DTD measurements for ' + label);
      return pairs.map(m => [Number(m[1]), Number(m[2])]);
    }
    const accuracy = values(/^\s*DTD\s+10\s+acc\./);
    const ap = values(/^\s*DTD\s+10\s+mAP/);
    const models = ['IFV', 'BoVW', 'VLAD', 'LLC', 'KCB', 'DeCAF', 'IFV + DeCAF'];
    return checked(models.map((model, i) => ({
      model, setting: 'Linear SVM', score: accuracy[i][0], trials: 10,
      metrics: { std: accuracy[i][1], mAP: ap[i][0], mAPStd: ap[i][1] },
    })), 7);
  },
} satisfies Leaderboard;
