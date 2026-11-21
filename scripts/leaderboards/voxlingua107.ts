// VoxLingua107 tests language identification on recorded speech.
// Scholar Compass ranks the models that report accuracy on the held-out VoxLingua107 samples.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://scholarcompass.net/en/tasks/spoken-language-identification/benchmarks/voxlingua107';
const board: Leaderboard = {
  benchmark: 'voxlingua107', url: feed, feed, host: 'Scholar Compass',
  terms: 'Scholar Compass credits the linked papers on its public leaderboard. https://scholarcompass.net/',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].slice(0, 4).map(c => c.text).join('|') === '#|Model|Accuracy|Average Error Rate');
    if (!table) throw Error('Missing VoxLingua107 accuracy leaderboard');
    const rows = table.slice(1).map(cells => {
      const model = cells[1].text.replace(/\s*☆ Uses extra data$/, '');
      if (!/^\d+(?:\.\d+)?$/.test(cells[2].text)) throw Error('Invalid accuracy for ' + model);
      return { model, score: Number(cells[2].text), setting: cells[1].text.endsWith('Uses extra data') ? 'Uses extra data' : undefined };
    });
    return checked(rows, 2);
  },
};
export default board;
