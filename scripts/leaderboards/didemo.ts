// DiDeMo tests whether a model retrieves the video moment described by a sentence.
// The authors' README reports Rank@1 on the test split for three retrained models.
// Rank@5, mean intersection over union, and the validation scores accompany the test result.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://github.com/LisaAnne/LocalizingMoments';
const feed = 'https://raw.githubusercontent.com/LisaAnne/LocalizingMoments/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'didemo', url, feed, terms: 'The authors specify the BSD 2-Clause license. ' + url + '#license',
  parts: { rank5: 'Test Rank@5', miou: 'Test mIoU', valRank1: 'Validation Rank@1', valRank5: 'Validation Rank@5', valMiou: 'Validation mIoU' },
  async fetch() {
    const readme = await fetchText(feed);
    const table = readme.split('| | Rank@1 | Rank@5 | mIOU |')[1]?.split('**Training**')[0];
    if (!table) throw Error('Missing evaluation table');
    const rows = new Map<string, Record<string,number>>();
    for (const line of table.split('\n').filter(line => line.startsWith('|') && !line.includes('---'))) {
      const [name, ...cells] = line.trim().slice(1,-1).split('|').map(x => x.trim());
      const label = name.match(/^(.+?) (val|test)(.*)$/);
      if (!label || cells.length !== 3 || cells.some(v => !/^0\.\d+$/.test(v))) throw Error('Unexpected evaluation row');
      const model = label[1] + label[3];
      const keys = label[2] === 'test' ? ['rank1','rank5','miou'] : ['valRank1','valRank5','valMiou'];
      const metrics = rows.get(model) ?? {};
      keys.forEach((key, i) => { metrics[key] = Number(cells[i]) * 100; });
      rows.set(model, metrics);
    }
    return checked(Array.from(rows, ([model, metrics]) => {
      if (Object.keys(metrics).length !== 6) throw Error('Missing split for ' + model);
      return { model, score: metrics.rank1, metrics };
    }), 3);
  },
};
export default board;
