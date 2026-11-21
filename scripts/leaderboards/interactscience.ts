// InteractScience tests code generation for interactive scientific demonstrations.
// Its main results table reports functional pass rates and visual quality on different scales.
// The headline is the overall percentage of program functionality tests passed.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/open-compass/InteractScience/HEAD/README.md';
const columns = ['Model', 'PFT Overall (%)', 'PFT Average (%)', 'PFT Perfect (%)', 'VQT Action (%)', 'VQT CLIP', 'VQT VLM-judge'];
const board: Leaderboard = {
  benchmark: 'interactscience', url: 'https://github.com/open-compass/InteractScience#experiments', feed,
  terms: 'The authors release InteractScience under Apache 2.0 at https://opensource.org/license/apache-2-0.',
  aliases: {
    'Llama-3.1-70B-Instruct': 'llama-3-1-70b', 'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Qwen2.5-Coder-7B-Instruct': 'qwen2-5-coder-7b',
  },
  headline: 'The authors report separate functional and visual measures. The headline is the overall functional test pass rate.',
  parts: {
    pftOverall: {name: 'PFT Overall', unit: '%'}, vqtAction: {name: 'VQT Action', unit: '%'},
    vqtClip: {name: 'VQT CLIP', unit: 'score'}, vqtJudge: {name: 'VQT VLM-judge', unit: 'score'},
  },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === columns.join('|'));
    if (!table) throw new Error('Missing InteractScience experiment columns');
    const models = table.slice(1).filter(row => !/^(?:Closed|Open)-Source Large Language Models$/.test(row[0]));
    return checked(models.map(([model, ...values]) => {
      if (values.length !== 6) throw new Error('Missing InteractScience scores for ' + model);
      const [score, pftAverage, pftPerfect, vqtAction, vqtClip, vqtJudge] = values.map(v => numberCell(v));
      return { model, score, metrics: { pftOverall: score, pftAverage, pftPerfect, vqtAction, vqtClip, vqtJudge } };
    }), 30);
  },
};
export default board;
