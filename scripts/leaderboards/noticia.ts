// NoticIA asks models to answer Spanish clickbait headlines with a short summary of the news article.
// Table 8 gives the ROUGE score on a 0 to 100 scale and average summary length in words.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2404.07611';
const board: Leaderboard = {
  benchmark: 'noticia', url: feed, feed, static: 'paper',
  terms: 'The authors publish the paper under the terms linked at https://arxiv.org/abs/2404.07611.',
  stats: { averageSummaryWords: { name: 'Average summary words', unit: 'count', note: 'Average number of words in each generated news summary.' } },
  async fetch() {
    const html = await paperHtml(feed);
    const table = html.match(/<figure\b[^>]*id="A6\.T8"[^>]*>([\s\S]*?)<\/figure>/)?.[1];
    if (!table?.includes('ROUGE score and average summary lengths')) throw new Error('Missing NoticIA Table 8');
    const cells = table.split(/<span\b[^>]*class="ltx_tr"[^>]*>/).slice(1).map(row =>
      [...row.matchAll(/<span\b[^>]*class="ltx_td [^"]*"[^>]*>([\s\S]*?)<\/span>/g)].map(m => text(m[1])));
    if (cells.shift()?.join('|') !== 'Model Name|ROUGE Score|Average Summary Length') throw new Error('Unexpected NoticIA columns');
    const rows = cells.filter(([model]) => model !== 'Human').map(([model, rouge, words]) => ({
      model, score: numberCell(rouge), metrics: { averageSummaryWords: numberCell(words) },
    }));
    return checked(rows, 36);
  },
};
export default board;
