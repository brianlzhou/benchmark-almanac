// CivilComments-WILDS tests toxicity classification. The WILDS leaderboard ranks trained
// classifiers by test worst-group accuracy. Parentheses contain corrected sample standard deviations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://wilds.stanford.edu/leaderboard/';
const board: Leaderboard = {
  benchmark: 'civilcomments-wilds', url: feed + '#civilcomments', feed,
  terms: 'The WILDS team publishes and attributes each submission at https://wilds.stanford.edu/leaderboard/.',
  async fetch() {
    const html = await fetchText(feed);
    const section = html.split('<h3 id="civilcomments">')[1]?.split('<h3')[0];
    const tracks = section?.split(/<h5[^>]*>/).slice(1);
    if (tracks?.length !== 2) throw new Error('Missing CivilComments tracks');
    const rows: LeaderboardRow[] = [];
    for (const track of tracks) {
      const setting = track.split('</h5>')[0];
      const table = tables(track)[0]?.map(r => r.map(c => c.text));
      if (table?.[0].slice(3,7).join('|') !== 'Val Avg Acc|Val Worst-Group Acc|Test Avg Acc|Test Worst-Group Acc ▼') {
        throw new Error('Missing CivilComments accuracy columns');
      }
      for (const c of table.slice(1)) {
        const values = c.slice(3,7).map(cell => {
          const m = cell.match(/^(\d+(?:\.\d+)?) \((\d+(?:\.\d+)?)\)$/);
          if (!m) throw new Error('Missing accuracy or standard deviation');
          return m.slice(1).map(Number);
        });
        const metrics: Record<string, number> = {std: values[3][1], rank: Number(c[0])};
        ['valAvg', 'valWorstGroup', 'testAvg'].forEach((key,i) => {
          metrics[key] = values[i][0];
          metrics[key+'Std'] = values[i][1];
        });
        rows.push({model: c[2], setting: c[1] + ', ' + setting, score: values[3][0], submitter: c[7],
          date: new Date(c[9] + ' UTC').toISOString().slice(0,10), metrics});
      }
    }
    return checked(rows, 17);
  },
};
export default board;
