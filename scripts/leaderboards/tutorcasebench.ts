// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// TutorCaseBench tests how models respond to student difficulties. Tables 1 and 3 report open-ended success
// and multiple-choice accuracy. Table 7 gives the fraction of individual rubric criteria satisfied.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.30828';
const board: Leaderboard = {
  benchmark: 'tutorcasebench', static: 'paper', url: feed, feed,
  terms: 'The authors publish these tables under the license on the arXiv record. https://arxiv.org/abs/2610.30828',
  headline: 'The paper reports no overall score, so this is the plain mean of open-ended success and multiple-choice accuracy.',
  parts: {open: 'Open-ended response', mcq: '4-option MCQ', openImmediate: {name:'Immediate',group:'Open-ended response'}, openLongTerm: {name:'Long-Term',group:'Open-ended response'},
    mcqImmediate: {name:'Immediate',group:'4-option MCQ'}, mcqLongTerm: {name:'Long-Term',group:'4-option MCQ'}},
  stats: {
    criteriaImmediate: { name: 'Immediate criterion satisfaction', unit: '%', better: 'higher' },
    criteriaLongTerm: { name: 'Long-term criterion satisfaction', unit: '%', better: 'higher' },
    criteriaOverall: { name: 'Overall criterion satisfaction', unit: '%', better: 'higher' },
  },
  aliases: {'Qwen 3.5-397B': 'qwen3-5-397b-a17b'},
  async fetch() {
    const html = await paperHtml(feed);
    function results(caption: string) {
      const figure = [...html.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)].find(m => m[0].includes(caption))?.[0];
      const table = figure && paperTables(figure).map(grid)[0];
      if (!table || !['Model','Immediate','Long-Term','Overall'].every((h,i) => table[0][i]?.startsWith(h))) throw new Error('Missing ' + caption);
      return new Map(table.slice(1).map(([model,...values]) => [model,values.map(numberCell)]));
    }
    const open = results('Success rate of open-ended response');
    const mcq = results('Accuracy on 4-option MCQ cases');
    const criteria = results('Average criterion satisfaction rate');
    const rows = [...open].map(([model, [openImmediate,openLongTerm,openScore]]) => {
      if (!mcq.has(model) || !criteria.has(model)) throw new Error('Missing TutorCaseBench result for ' + model);
      const [mcqImmediate,mcqLongTerm,mcqScore] = mcq.get(model)!;
      const [criteriaImmediate,criteriaLongTerm,criteriaOverall] = criteria.get(model)!;
      return {model, score: (openScore+mcqScore)/2, metrics: {open:openScore, mcq:mcqScore, openImmediate,openLongTerm,mcqImmediate,mcqLongTerm,criteriaImmediate,criteriaLongTerm,criteriaOverall}};
    });
    return checked(rows, 11);
  },
};
export default board;
