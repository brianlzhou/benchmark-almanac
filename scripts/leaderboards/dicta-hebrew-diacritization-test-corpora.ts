// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Tables 1 to 3 test Hebrew diacritization across genres. Word accuracy requires all diacritics in a word to be correct.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2005.03312';
const genres = ['Modern','Rabbinic','Poetic'];
const board: Leaderboard = {
  benchmark:'dicta-hebrew-diacritization-test-corpora', static:'paper',url:feed,feed,terms:PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline:'The paper gives no overall score. The headline is the plain mean of word accuracy on Modern, Rabbinic and Poetic Hebrew.',
  parts:Object.fromEntries(genres.flatMap(genre=>[[genre,genre+' word accuracy'],[genre+'Letter',genre+' letter accuracy']])),
  async fetch() {
    const html = await paperHtml(feed);
    const figures = [...html.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)].map(m => m[0]);
    const tables = genres.map(genre => {
      const figure = figures.find(f => f.includes('Accuracy on '+genre+' Hebrew Test Corpus'));
      const table = figure && paperTables(figure).map(grid)[0];
      if (!table || table[0].join('|') !== '|Letter Accuracy|Word Accuracy') throw Error('Missing '+genre+' accuracies');
      return table.slice(1);
    });
    const rows = tables[0].map(([model]) => {
      const metrics: Record<string,number> = {};
      for (const [i,genre] of genres.entries()) {
        const cells = tables[i].find(r=>r[0]===model);
        if (!cells || !cells.slice(1).every(s=>/^\d+(?:\.\d+)?%$/.test(s))) throw Error('Missing accuracies for '+model);
        metrics[genre+'Letter'] = parseFloat(cells[1]);
        metrics[genre] = parseFloat(cells[2]);
      }
      return {model,score:genres.reduce((sum,genre)=>sum+metrics[genre],0)/3,metrics};
    });
    return checked(rows,3);
  },
};
export default board;
