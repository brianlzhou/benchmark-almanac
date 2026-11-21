// Something-Something V2 tests video recognition of everyday actions.
// SOTA2 ranks configurations by top-1 classification accuracy and also lists top-5 accuracy for some models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/video-classification-on-something-something-v2';
const board: Leaderboard = {
  benchmark: 'something-something-v2', host: 'SOTA2 Research', url: feed, feed,
  stats: { top5: {name: 'Top-5 accuracy', unit: '%', better: 'higher'} },
  terms: 'SOTA2 Research publishes this public comparison and links each result to its paper. https://www.sota2.com/research/sota/video-classification-on-something-something-v2',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === 'Method|Links|Top-1 Acc|Top-5 Acc|Average Accuracy');
    if (!table) throw new Error('SOTA2 video classification table changed');
    const rows: LeaderboardRow[] = [];
    for (const [method, , top1, top5, average] of table.slice(1)) {
      if (top1.text === '—') continue;
      const anchor = method.html.match(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/);
      if (!anchor) throw new Error('Missing method link');
      const model = text(anchor[2]);
      if (/et al\.$/.test(model) || model === 'Supervised') continue;
      const setting = text(method.html.match(/role="tooltip"[^>]*>(.*?)<\/span>/)?.[1] ?? '');
      const metrics: Record<string, number> = {};
      for (const [key, value] of [['top5', top5.text], ['averageAccuracy', average.text]]) {
        if (value !== '—') metrics[key] = Number(value);
      }
      if (!Object.values(metrics).every(Number.isFinite) || !/^\d+(?:\.\d+)?$/.test(top1.text)) throw new Error('Invalid accuracy for ' + model);
      rows.push({model, setting: setting || undefined, score: Number(top1.text), metrics, link: new URL(anchor[1], feed).href});
    }
    return checked(rows, 75);
  },
};
export default board;
