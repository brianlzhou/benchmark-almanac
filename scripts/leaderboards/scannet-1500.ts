// ScanNet-1500 evaluates relative camera pose estimates on 1,500 indoor image pairs.
// SOTA2 ranks models by area under the pose error curve at five degrees and reports two other thresholds.
import type { Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/relative-camera-pose-evaluation-on-scannet1500';
const board: Leaderboard = {
  benchmark: 'scannet-1500', url: feed, feed, host: 'SOTA2',
  terms: 'SOTA2 publishes and attributes each result at ' + feed + '.',
  parts: {auc10: 'AUC at 10 degrees', auc20: 'AUC at 20 degrees'},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Method|Links|AUC@5|AUC@10|AUC@20');
    if (!table) throw new Error('Missing ScanNet-1500 pose AUC columns');
    return checked(table.slice(1).map(([name,,five,ten,twenty]) => {
      const entry = name.html.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!entry) throw new Error('Missing ScanNet model or source paper');
      const setting = text(name.html.match(/role="tooltip">([\s\S]*?)<\/span>/)?.[1] ?? '');
      return {model: text(entry[2]), setting: setting || undefined, link: new URL(entry[1],feed).href,
        score: numberCell(five.text), metrics: {auc10: numberCell(ten.text), auc20: numberCell(twenty.text)}};
    }), 23);
  },
};
export default board;
