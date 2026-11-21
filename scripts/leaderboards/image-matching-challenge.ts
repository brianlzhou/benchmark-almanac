// Image Matching Challenge scores local feature matching in stereo and multiview reconstruction.
// Its two 2021 leaders tables rank methods by average rank across six dataset and task combinations.
// Each part retains the published mean Average Accuracy at a ten-degree error threshold.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://www.cs.ubc.ca/research/image-matching-challenge/2021/leaderboard/';
const keys = ['photoStereo', 'photoMultiview', 'pragueStereo', 'pragueMultiview', 'urbanStereo', 'urbanMultiview'];
const groups = ['Phototourism', 'PragueParks', 'GoogleUrban'];
const board: Leaderboard = {
  benchmark: 'image-matching-challenge', url, feed: url,
  terms: 'The Image Matching Challenge organizers publish the 2021 results. https://www.cs.ubc.ca/research/image-matching-challenge/2021/leaderboard/',
  parts: Object.fromEntries(keys.map((k, i) => [k, { name: i % 2 ? 'Multiview' : 'Stereo',
    group: groups[Math.floor(i / 2)], note: 'Mean Average Accuracy at 10 degrees', unit: 'score', better: 'higher' }])),
  async fetch() {
    const html = await fetchText(url);
    const rows: LeaderboardRow[] = [];
    for (const category of ['Unlimited', 'Restricted']) {
      const section = html.split('Leaders: ' + category + ' keypoints category')[1];
      const table = section && tables(section.slice(0, section.indexOf('</table>') + 8))[0];
      if (!table || table[0].slice(1).map(c => c.text).join() !== [...groups, 'Combined'].join()
          || table[1].at(-1)?.text !== 'Avg. Rank') throw new Error('Missing leaders table');
      for (const row of table.slice(2)) {
        const model = row[0].html.match(/<a href="([^"]+)">([^<]+)<\/a>/);
        if (!model || row.length !== 8) throw new Error('Invalid method row');
        const metrics: Record<string, number> = {};
        keys.forEach((k, i) => {
          const m = row[i+1].text.match(/^(\d+\.\d+) Rank: (\d+)$/);
          if (!m) throw new Error('Missing task accuracy or rank');
          metrics[k] = Number(m[1]);
          metrics[k+'Rank'] = Number(m[2]);
        });
        const score = Number(row[7].text);
        const mean = keys.reduce((sum, k) => sum + metrics[k+'Rank'], 0) / 6;
        if (Math.abs(score - mean) > 0.0051) throw new Error('Average rank disagrees with six track ranks');
        rows.push({ model: text(model[2]), link: model[1], setting: category + ' keypoints', score, metrics });
      }
    }
    return checked(rows, 10);
  },
};
export default board;
