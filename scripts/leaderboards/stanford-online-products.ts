// Stanford Online Products tests retrieval of images of the same product. Open Metric Learning reports top-1 retrieval accuracy at 224 by 224 pixels.
// The model zoo has separate tables for its own checkpoints and checkpoints from other researchers.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/OML-Team/open-metric-learning/main/README.md';
const board: Leaderboard = {
  benchmark: 'stanford-online-products', host: 'Open Metric Learning', url: 'https://github.com/OML-Team/open-metric-learning#image-models-zoo', feed,
  terms: 'The repository uses Apache 2.0. https://github.com/OML-Team/open-metric-learning/blob/main/LICENSE',
  async fetch() {
    const section = (await fetchText(feed)).split('### Image models zoo')[1]?.split('## [Zoo: Texts]')[0];
    if (!section || !/model\s*\|\s*cmc1\s*\|\s*dataset/.test(section) || !/model\s*\|\s*Stanford Online Products\s*\|/.test(section)) throw new Error('Model zoo retrieval tables missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      const cells = line.split('|').slice(1,-1).map(s => s.trim());
      const model = cells[0]?.match(/\.from_pretrained\("([^"]+)"\)/)?.[1];
      if (!model || (cells.length === 5 && cells[2] !== 'Stanford Online Products' && !/^\d\.\d+$/.test(cells[2]))) continue;
      if (!/^\d\.\d+$/.test(cells[1])) throw new Error('Model zoo CMC@1 missing for ' + model);
      rows.push({model, score: Number((Number(cells[1]) * 100).toFixed(3)), setting: '224 x 224'});
    }
    return checked(rows, 23);
  },
};
export default board;
