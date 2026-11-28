// MIMIC-CXR classification tests recognition of findings in chest radiographs. CodeSOTA reports
// AUROC on a 100-point scale. Its unverified entries do not identify a split or label set.
// TorchXRayVision names a software library without specifying which of its classifiers was evaluated.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://www.codesota.com/benchmark/mimic-cxr';
const board: Leaderboard = {
  benchmark:'mimic-cxr-classification', host:'CodeSOTA', url, feed:url,
  terms:'CodeSOTA publishes the leaderboard publicly and retains copyright. https://www.codesota.com/benchmark/mimic-cxr',
  headline:'CodeSOTA reports AUROC on a 100-point scale and does not specify the test split or label set.',
  verified:'CodeSOTA marks the result as verified',
  async fetch() {
    const html = await fetchText(url);
    const section = html.match(/Auroc is the reported evaluation metric[\s\S]*?<\/table>/i)?.[0];
    const table = section && tables(section).find(t => t[0].map(c => c.text).join('|') === 'Rank|Model|Trust|Score|Year|Links|Fix');
    if (!table) throw new Error('Missing CodeSOTA AUROC results');
    const rows = table.slice(1).flatMap(cells => {
      const model = cells[1].text.split(' Non-API entry')[0].trim();
      if (model === 'torchxrayvision') return [];
      return [{model,score:numberCell(cells[3].text),verified:cells[2].text === 'verified'}];
    });
    return checked(rows,2);
  },
};
export default board;
