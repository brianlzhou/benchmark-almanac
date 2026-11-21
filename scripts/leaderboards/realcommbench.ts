// RealCommBench tests audio deepfake detectors on recordings transmitted through real calls.
// The project site's zero-shot and adaptation tables report pooled call equal error rate, in percent.
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';
const feed = 'https://wwwwwli.github.io/RealComm/';
const board: Leaderboard = {
  benchmark: 'realcommbench', url: feed, feed,
  terms: 'The authors publish these tables on their project site. Release terms are described at https://github.com/AmphionTeam/RealComm.',
  stats: { digitalEER: { name: 'Digital equal error rate', unit: '%', better: 'lower' }, increase: { name: 'Equal error rate increase', unit: '%', better: 'lower', note: 'Increase from digital to real-call conditions, in percentage points.' } },
  async fetch() {
    const source = tables(await fetchText(feed)).map(grid);
    const zero = source.find(t => t[0].join('|') === 'Detector|Digital|Call|ΔEER (pp)');
    const adapt = source.find(t => t[0].join('|') === 'Detector|Domain|F|A|T|A+T');
    if (!zero || !adapt) throw new Error('Missing RealComm detector or adaptation table');
    const rows: LeaderboardRow[] = zero.slice(1).map(([model, digital, call, delta]) => ({model,
      setting: 'Zero-shot', score: numberCell(call), metrics: {digitalEER: numberCell(digital), increase: numberCell(delta.replace(/^\+/, ''))}}));
    const settings = ['Frozen baseline', 'Simulated augmentation', 'Real-call adaptation', 'Simulated augmentation and real-call adaptation'];
    for (const [model, domain, ...call] of adapt.slice(1)) {
      if (domain !== 'Call') continue;
      const digital = adapt.find(r => r[0] === model && r[1] === 'Digital');
      if (!digital || call.length !== 4) throw new Error('Missing adaptation domain for ' + model);
      settings.forEach((setting, i) => rows.push({model, setting, score: numberCell(call[i]), trials: 1, metrics: {digitalEER: numberCell(digital[i+2])}}));
    }
    return checked(rows, 17);
  },
};
export default board;
