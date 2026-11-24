// HalluLens tests hallucinations on three tasks. Tables 2 to 4 report different measures. The headline is Table 2's
// PreciseWikiQA hallucination rate ("Hallucinated when not refused"), the benchmark's own construct. Its first column,
// the false refusal rate, would rank a model that never refuses as best, so it stays a part.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2504.17550';
const board: Leaderboard = {
  benchmark: 'hallulens', static: 'paper', feed, url: feed,
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2504.17550.',
  headline: 'The paper gives no overall score. This is the PreciseWikiQA hallucination rate: the share of answered questions the model got wrong. Lower is better.',
  parts: { precise: { name: 'PreciseWikiQA false refusal rate', better: 'lower' }, long: 'LongWiki F1@32',
    nonexistent: { name: 'NonExistentRefusal false acceptance rate', better: 'lower' },
    mixed: { name: 'MixedEntities false acceptance rate', better: 'lower' },
    generated: { name: 'GeneratedEntities false acceptance rate', better: 'lower' } },
  stats: { correct: { name: 'PreciseWikiQA correct answer rate', unit: '%', better: 'higher' },
    longRefusal: { name: 'LongWiki false refusal rate', unit: '%', better: 'lower' },
    recall: { name: 'LongWiki recall@32', unit: '%', better: 'higher' },
    precision: { name: 'LongWiki precision', unit: '%', better: 'higher' } },
  aliases: { 'Llama-3.3-70B-Instruct': 'llama-3-3-70b-instruct' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const get = (header: string) => {
      const table = tables.find(t => t[0].join('|') === header);
      if (!table) throw new Error('Missing columns: ' + header);
      return new Map(table.slice(1).map(([model, ...cells]) => [model, cells.map(numberCell)]));
    };
    const precise = get('|False Refusal Rate|Hallucinated when not refused|Correct Answer Rate');
    const long = get('|False Refusal Rate|Recall@32|Precision|F1@32');
    const non = get('Model|MixedEntities|GeneratedEntities|Average');
    const rows = [...precise].map(([model, [score, hallucinated, correct]]) => {
      const l = long.get(model), n = non.get(model);
      if (!l || !n) throw new Error('Missing task scores for ' + model);
      return { model, score: hallucinated, trials: 3, metrics: { precise: score, correct,
        longRefusal: l[0], recall: l[1], precision: l[2], long: l[3], mixed: n[0], generated: n[1], nonexistent: n[2] } };
    });
    return checked(rows, 13);
  },
};
export default board;
