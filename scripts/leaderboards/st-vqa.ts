// ST-VQA tests visual question answering that requires reading scene text.
// SOTA2 ranks the test leaderboard by ANLS and separately publishes accuracy for later rows.
import type { Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/scene-text-visual-question-answering-on-st-vqa-test';
const board: Leaderboard = {
  benchmark: 'st-vqa', url: feed, feed, host: 'SOTA2',
  terms: 'SOTA2 publishes this leaderboard at ' + feed + '.',
  stats: {accuracy:{name:'Accuracy',better:'higher',note:'Exact-match accuracy, which SOTA2 publishes for some later rows.'}},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Method|Links|ANLS|Accuracy');
    if (!table) throw new Error('Missing ST-VQA leaderboard');
    return checked(table.slice(1).flatMap(([method,,anls,accuracy]) => {
      const anchor = method.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/);
      if (!anchor || anls.text === '—') return [];
      const setting = text(method.html.match(/role="tooltip">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const metrics: Record<string, number> = accuracy.text === '—' ? {} : {accuracy:numberCell(accuracy.text)};
      return [{model:text(anchor[1]).replace(/[†⁺]+$/,''), setting:setting || undefined, score:numberCell(anls.text), metrics}];
    }), 21);
  },
};
export default board;
