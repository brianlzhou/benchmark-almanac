// SlideVQA asks questions over complete presentation decks, including multi-hop and numerical questions.
// SOTA2's test leaderboard ranks document question answering by exact match and reports F1.
import type { Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/document-question-answering-on-slidevqa-test';
const board: Leaderboard = {
  benchmark: 'slidevqa', url: feed, feed, host: 'SOTA2',
  terms: 'SOTA2 publishes this leaderboard at ' + feed + '.',
  parts: {f1:'F1', accuracy:'Accuracy'},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Method|Links|EM|F1|Accuracy');
    if (!table) throw new Error('Missing SlideVQA test leaderboard');
    const rows = table.slice(1).flatMap(([method,,em,f1,accuracy]) => {
      if (em.text === '—') return [];
      const entry = method.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/);
      if (!entry) throw new Error('Missing SlideVQA model');
      const setting = text(method.html.match(/role="tooltip">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const metrics: Record<string,number> = {};
      if (f1.text !== '—') metrics.f1 = numberCell(f1.text);
      if (accuracy.text !== '—') metrics.accuracy = numberCell(accuracy.text);
      return [{model: text(entry[1]), setting: setting || undefined, score:numberCell(em.text), metrics}];
    });
    return checked(rows, 12);
  },
};
export default board;
