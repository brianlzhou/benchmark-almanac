// DIHARD III tests who spoke when. Its final leaderboard ranks systems by core-set diarization error rate.
// The linked submission descriptions identify the systems below. The full-set and Jaccard error rates remain available.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://dihardchallenge.github.io/dihard3/results';
const systems: Record<string, string> = {
  team54: 'USTC-NELSLIP System', team115: 'Hitachi-JHU DIHARD III System',
  team50: 'DKU-Duke-Lenovo System', team55: 'BUT DIHARD III System', team106: 'EDA-EEND with conformer encoders',
  team57: 'Domain Adaptive Diarization System', team60: 'ABSP System', team71: 'DiaboLIIc',
  team123: 'XMUSPEECH System', team96: 'GREAT-SHU Speaker Diarization System',
  team80: 'WPS (FTDNN)+NES', team94: 'AHC', team73: 'Primary system W/ FE & OSD',
  team67: 'DenseNet with agglomerative hierarchical clustering', team56: 'UWB-NTIS x-vector clustering system',
  team7: 'CRIM primary system', team93: 'Xvectors with adaptive threshold', team18: 'DIHARD III baseline',
};
const board: Leaderboard = {
  benchmark: 'dihard-iii', url: feed, feed,
  terms: 'The organizers publish results under the challenge terms at https://dihardchallenge.github.io/dihard3/#plan.',
  headline: 'The leaderboard ranks systems by diarization error rate on the core evaluation set.',
  parts: { fullDER: { name: 'Full set DER', better: 'lower' } },
  stats: {
    coreJER: { name: 'Core set JER', unit: '%', better: 'lower', note: 'Jaccard error rate on the core evaluation set.' },
    fullJER: { name: 'Full set JER', unit: '%', better: 'lower', note: 'Jaccard error rate on the full evaluation set.' },
  },
  async fetch() {
    const html = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    for (const track of [1, 2]) {
      const fragment = html.match(new RegExp('<table id="tab_track' + track + '"[\\s\\S]*?</table>'));
      const table = fragment && tables(fragment[0])[0];
      if (!table || table[1].slice(7).map(c => c.attrs['data-field']).join('|') !== 'der_core|jer_core|der_full|jer_full') {
        throw new Error('DIHARD results columns changed');
      }
      for (const cells of table.slice(2)) {
        const c = cells.map(cell => cell.text);
        const model = systems[c[5]?.match(/(team\d+)\.pdf$/)?.[1] ?? ''];
        if (!model) continue;
        if (c.length !== 11 || c.slice(7).some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid DIHARD result');
        rows.push({ model, submitter: c[1], date: c[4].slice(0, 10),
          link: new URL(c[5], feed).href, setting: track === 1 ? 'Reference speech segmentation' : 'System speech segmentation',
          score: Number(c[7]), metrics: { coreJER: Number(c[8]), fullDER: Number(c[9]), fullJER: Number(c[10]) } });
      }
    }
    return checked(rows, 29);
  },
};
export default board;
