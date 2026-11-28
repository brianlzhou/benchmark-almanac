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
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Method|Links|ANLS|Accuracy');
    if (!table) throw new Error('Missing ST-VQA leaderboard');
    return checked(table.slice(1).flatMap(([method, links, anls, accuracy]) => {
      const anchor = method.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/);
      if (!anchor || anls.text === '—') return [];
      const setting = text(method.html.match(/role="tooltip">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const dm = method.html.match(/<small>(\d{4})\.(\d{2})<\/small>/);
      const date = dm ? `${dm[1]}-${dm[2]}-01` : undefined;
      const paper = links.html.match(/href="(\/research\/paper\/[^"]+)"/i)?.[1];
      const link = links.html.match(/href="(https?:\/\/[^"]+)"/i)?.[1] ?? (paper ? `https://www.sota2.com${paper}` : undefined);
      const metrics: Record<string, number> | undefined = accuracy.text === '—' ? undefined : { accuracy: numberCell(accuracy.text) };
      return [{ model: text(anchor[1]).replace(/[†⁺]+$/, ''), setting: setting || undefined, score: numberCell(anls.text), ...(date ? { date } : {}), ...(link ? { link } : {}), ...(metrics ? { metrics } : {}) }];
    }), 21);
  },
};
export default board;
