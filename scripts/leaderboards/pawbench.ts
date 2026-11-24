// PAWBench tests whether video generators recover the probabilities and range of physical outcomes.
// Table 1 on the project page reports calibration and coverage separately. The headline is the first track's
// conditional total variation distance times 100. Lower is better. The other track measures coverage in percent.
import type { Leaderboard, BoardPart } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://pawbench.github.io/';
const keys = ['calibration', 'calibrationSPR', 'toss', 'rotation', 'routing', 'draw', 'coverage', 'coverageSPR', 'collision', 'stability', 'agent', 'material'];
const names = ['PAW-Calibration', 'Calibration scene pass rate', 'Toss', 'Rot.', 'Rout.', 'Draw', 'PAW-Coverage', 'Coverage scene pass rate', 'Coll.', 'Stab.', 'Agent', 'Mat.'];
const parts: Record<string, BoardPart> = {};
keys.forEach((key, i) => {
  const calibration = i < 6 && i !== 1;
  parts[key] = { name: names[i], group: i < 6 ? 'PAW-Calibration' : 'PAW-Coverage',
    better: calibration ? 'lower' : 'higher', unit: calibration ? 'score' : '%' };
});
const board: Leaderboard = {
  benchmark: 'pawbench', url: feed, feed, parts,
  headline: 'The headline is PAW-Calibration, the first track. Lower total variation distance indicates better calibration.',
  aliases: { 'Seedance 2': 'dreamina-seedance-2-0' },
  terms: 'The authors publish the benchmark terms at https://github.com/Andrew0613/PAWBench.',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[1]?.text.includes('PAW-Calibration') && t[0]?.[2]?.text.includes('PAW-Coverage'));
    if (!table || table[1].map(c => c.text).join('|') !== 'Avg.|SPR|Toss|Rot.|Rout.|Draw|Avg.|SPR|Coll.|Stab.|Agent|Mat.') {
      throw new Error('PAWBench main results columns changed');
    }
    const rows = table.slice(2).filter(r => r.length !== 1 || r[0].text !== '').map(row => {
      if (row.length !== 13) throw new Error('Incomplete PAWBench row');
      const metrics: Record<string, number> = {};
      keys.forEach((key, i) => {
        const value = row[i + 1].text;
        if (value !== 'N/A') metrics[key] = numberCell(value.replace(/%$/, ''));
      });
      return { model: row[0].text, score: metrics.calibration, metrics };
    });
    return checked(rows, 11);
  },
};
export default board;
