// CS-4k evaluates answers about computer science research. Table 1 reports the overall
// judge score on a 0 to 100 scale and separate scores for eight research dimensions.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2510.20279';
const dimensions = ['Research domain','Previous methods','Existing challenges','Motivation',
  'Findings/ assump.','Methods','Exp. settings','Exp. results'];
const board: Leaderboard = {
  benchmark: 'cs-4k', static: 'paper', feed, url: feed,
  terms: 'The authors publish the paper on arXiv and the evaluation code under MIT. https://github.com/wph6/ResearchGPT#-license',
  parts: Object.fromEntries(dimensions.map((d,i) => [d,['Research domain','Previous methods','Existing challenges','Motivation',
    'Findings/Assumptions','Methods','Experimental settings','Experimental results'][i]])),
  aliases: {'Claude 4 Opus':'claude-opus-4', 'Claude 4 Sonnet':'claude-sonnet-4',
    'Qwen3-235B-A22B-Thinking-2507':'qwen3-235b-a22b-thinking-jul-2025',
    'Qwen3-235B-A22B-Instruct-2507':'qwen3-235b-a22b-instruct-jul-2025'},
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === ['Model',...dimensions,'Overall'].join('|'));
    if (!t) throw new Error('Missing CS-4k dimensions');
    return checked(t.slice(1).filter(c => !c.every(v => v === c[0])).map(c => {
      const search = /^Gemini .* Search$/.test(c[0]);
      const name = search ? c[0].replace(/ Search$/, '') : c[0];
      return {model: name === 'Gemini 2.5 Flash' ? name + ' (snapshot unspecified)' : name, setting: search ? 'Search enabled' : undefined,
        score: numberCell(c[9]), metrics: Object.fromEntries(dimensions.map((d,i) => [d,numberCell(c[i+1])]))};
    }),32);
  },
};
export default board;
