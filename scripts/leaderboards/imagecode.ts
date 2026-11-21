// ImageCoDe tests retrieval of an image from visually similar alternatives.
// The project leaderboard gives overall accuracy, followed by the video and static image subsets.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mcgill-nlp.github.io/imagecode/';
const board: Leaderboard = {
  benchmark: 'imagecode', url: feed, feed,
  terms: 'The project uses the MIT license. https://github.com/McGill-NLP/imagecode/blob/HEAD/LICENSE',
  parts: { video: 'Video', static: 'Static' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === 'Rank|Model|Accuracy in % (video & static)');
    if (!table) throw new Error('Missing ImageCoDe leaderboard columns');
    const rows = table.slice(1).filter(r => r[1].text !== 'Human Performance').map(r => {
      const identity = r[1].html.match(/<div>(.*?)<\/div>([\s\S]*)/i);
      const values = r[2].text.match(/^([\d.]+) \(([\d.]+) & ([\d.]+)\)$/);
      if (!identity || !values) throw new Error('Invalid ImageCoDe result');
      const model = text(identity[1]).replace(/^Baseline: /, '');
      const date = new Date(r[0].text.replace(/^\d+ /, '') + ' UTC').toISOString().slice(0, 10);
      return { model, score: Number(values[1]), metrics: { video: Number(values[2]), static: Number(values[3]) },
        date, submitter: text(identity[2]), link: r[1].html.match(/href="([^"]+)"/)?.[1] };
    });
    return checked(rows, 5);
  },
};
export default board;
