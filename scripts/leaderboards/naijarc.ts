// The source reports no overall score for NaijaRC alone. The headline is the plain mean of the three parts, computed by this importer.
// NaijaRC tests multiple-choice reading comprehension in Hausa, Igbo and Yorùbá. Table 1(b)
// includes an English Belebele result in its AVG column. Only the three Nigerian languages enter this headline.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url='https://arxiv.org/html/2308.09768';
const board: Leaderboard = {
  benchmark:'naijarc', static:'paper', url, feed:url, terms:PAPER_TERMS,
  headline:'The headline is mean accuracy across the three NaijaRC languages. The paper also includes English Belebele in its reported average.',
  parts:{hau:{name:'Hausa',unit:'%'},ibo:{name:'Igbo',unit:'%'},yor:{name:'Yorùbá',unit:'%'},
    eng:{name:'English Belebele',group:'Comparison',unit:'%'},published:{name:'Average including Belebele',group:'Comparison',unit:'%'}},
  async fetch() {
    const t = flatPaperTables(await paperHtml(url)).map(grid).find(t => t[1]?.join('|') === 'Model|eng|hau|ibo|yor|AVG');
    if (!t) throw new Error('Missing NaijaRC model accuracy table');
    return checked(t.slice(2).map(([model,...cells]) => {
      if (cells.length !== 5) throw new Error('Incomplete language scores');
      const [eng,hau,ibo,yor,published] = cells.map(numberCell);
      const setting = model.startsWith('GPT-') ? 'Prompted with passage and options' : 'Zero-shot transfer from Belebele';
      return {model,setting,score:(hau+ibo+yor)/3,metrics:{eng,hau,ibo,yor,published}};
    }),5);
  },
};
export default board;
