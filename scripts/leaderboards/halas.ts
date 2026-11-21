// HALAS annotates hallucinations in automatic transcriptions of earnings calls.
// Table 2 gives the percentage of selected utterances with hallucinations for each recognizer.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2606.23048';
const names = ['Whisper large v2', 'Whisper large v3', 'Whisper large v3 Turbo', 'Crisper Whisper', 'Canary-1B', 'Canary-1B-Flash', 'Parakeet-TDT version 2'];
const board: Leaderboard = {
  benchmark: 'halas', url: feed, feed, static: 'paper',
  terms: 'The authors publish Table 2 at https://arxiv.org/abs/2606.23048.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Model|Wv2|Wv3|Wv3T|CrW|Can|CanF|Par|Average');
    if (!table) throw new Error('HALAS annotation table missing');
    function row(label: string) {
      const cells = table!.find(c => c[0] === label);
      if (cells?.length !== 9) throw new Error('Missing HALAS metric: ' + label);
      return cells.slice(1, -1);
    }
    const rates = row('Hallucination Rate [%]');
    const errors = row('Annotated Errors [#]');
    const loops = row('Looping Rate [%]');
    const wer = row('WER [%]');
    const top = row('Top 10 / 30 [%]');
    return checked(names.map((model, i) => {
      const [top10, top30] = top[i].split(' / ').map(numberCell);
      if (top30 === undefined) throw new Error('Missing Top 30');
      return { model, score: numberCell(rates[i]), metrics: { annotatedErrors: numberCell(errors[i]),
        loopingRate: numberCell(loops[i]), wordErrorRate: numberCell(wer[i]), top10, top30 } };
    }), 7);
  },
};
export default board;
