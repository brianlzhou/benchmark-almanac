// VocalSound tests classification of six human vocal sounds.
// The authors' README leaderboard reports test accuracy in percent.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/YuanGongND/vocalsound/master/README.md';
const board: Leaderboard = {
  benchmark: 'vocalsound', url: 'https://github.com/YuanGongND/vocalsound', feed,
  terms: 'The authors release VocalSound under CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/',
  async fetch() {
    const lines = (await fetchText(feed)).split(/\r?\n/);
    const header = lines.findIndex(line => /^\|\s*Method\s*\|\s*Model\s*\|\s*Pretrain Dataset\s*\|\s*Accuracy\s*\|/.test(line));
    if (header < 0) throw new Error('Missing VocalSound leaderboard');
    const rows = [];
    for (const line of lines.slice(header + 2)) {
      if (!line.startsWith('|')) break;
      const [method, architecture, , accuracy] = line.split('|').slice(1).map(s => s.trim());
      const name = method.match(/^\[([^\]]+)\]/)?.[1];
      if (!name || !/^\d+(?:\.\d+)?$/.test(accuracy)) throw new Error('Unexpected VocalSound result');
      rows.push({ model: name === 'Baseline' ? architecture : name, score: Number(accuracy) });
    }
    return checked(rows, 2);
  },
};
export default board;
