// FSD50K tests recognition of sound events in audio clips.
// Scholar Compass ranks models by mean average precision. Convert the board's percentages to mAP on a 0 to 1 scale.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://scholarcompass.net/en/tasks/audio-classification/benchmarks/fsd50k';
const board: Leaderboard = {
  benchmark: 'fsd50k', host: 'Scholar Compass', url: feed, feed,
  terms: 'Scholar Compass terms of service: https://scholarcompass.net/en/terms',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[1]?.text === 'Model' && t[0]?.[2]?.text === 'mAP');
    if (!table) throw Error('Missing FSD50K mAP leaderboard');
    const rows = table.slice(1).map(cells => {
      const label = cells[1].text.replace(' ☆ Uses extra data', '').trim();
      const match = /^(CED-Base|CLAP) \((.+)\)$/.exec(label);
      if (!/^\d+(?:\.\d+)?$/.test(cells[2].text)) throw Error('Invalid mAP for ' + label);
      return { model: match?.[1] ?? label, setting: match?.[2], score: Number(cells[2].text) / 100 };
    });
    return checked(rows, 9);
  },
};
export default board;
