// MultiRef-Compass tests video generation from multiple references. The first metric in Table 2 is visual technical quality.
// Tables 2 and 3 use different scoring scales. Only supported metrics contribute a value.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2607.14189';
const board: Leaderboard = {
  benchmark: 'multiref-compass', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper reports separate metrics on different scales. The headline is visual technical quality (VTQ), the first metric in Table 2.',
  parts: {
    VTQ: { name: 'Visual technical quality', group: 'Basic Quality', unit: 'score' },
    ATQ: { name: 'Audio technical quality', group: 'Basic Quality', unit: 'score' },
    AQ: { name: 'Anatomical quality', group: 'Basic Quality', unit: 'score' },
    EF: { name: 'Entity fidelity', group: 'Reference Consistency', unit: 'score' },
    BC: { name: 'Binding correctness', group: 'Reference Consistency', unit: 'score' },
    DP: { name: 'Detail preservation', group: 'Reference Consistency', unit: 'score' },
    SLS: { name: 'Speech-lip synchronization', group: 'Audio-Visual Consistency', unit: 'score' },
    ESM: { name: 'Event-sound matching', group: 'Audio-Visual Consistency', unit: 'score' },
    SC: { name: 'Source correctness', group: 'Audio-Visual Consistency', unit: 'score' },
    VT: { name: 'Visual task following', group: 'Instruction Following', unit: 'score' },
    AT: { name: 'Audio task following', group: 'Instruction Following', unit: 'score' },
    SCA: { name: 'Speech content accuracy', group: 'Instruction Following', unit: 'score' },
    TO: { name: 'Temporal order following', group: 'Instruction Following', unit: 'score' },
  },
  stats: { evaluatedSamples: { name: 'Evaluated samples', unit: 'count' } },
  async fetch() {
    const paper = await paperHtml(feed);
    const tables = flatPaperTables(paper).map(grid);
    const auto = tables.find(t => t[1]?.join('|') === 'Model|Proprietary|VTQ|ATQ|EF|SLS');
    const judge = tables.find(t => t[1]?.join('|') === 'Model|Proprietary|AQ|BC|DP|ESM|SC|VT|AT|SCA|TO');
    if (!auto || !judge) throw Error('Missing MultiRef-Compass score columns');
    const rows = auto.slice(2).map(row => {
      const model = row[0].replace(/\*$/, '');
      const companion = judge.slice(2).find(r => r[0] === row[0]);
      if (!companion) throw Error('Missing judged metrics for ' + model);
      const metrics: Record<string, number> = {};
      for (const [table, cells] of [[auto, row], [judge, companion]] as const) {
        for (let i = 2; i < cells.length; i++) {
          const key = table[1][i];
          if (cells[i] === '–') continue;
          if (!/^\d+(\.\d+)?$/.test(cells[i])) throw Error('Invalid score for ' + model);
          metrics[key] = Number(cells[i]);
        }
      }
      if (row[0].endsWith('*')) {
        const count = paper.match(/evaluated on 282 and 245 samples, respectively/);
        if (!count) throw Error('Sample coverage changed');
        metrics.evaluatedSamples = model === 'Seedance 2.0' ? 282 : 245;
      }
      return { model, score: metrics.VTQ, metrics, open: row[1] === '\\times' };
    });
    return checked(rows, 8);
  },
};
export default board;
