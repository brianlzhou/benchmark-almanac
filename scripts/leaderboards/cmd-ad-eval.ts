// CMD-AD-Eval tests generated audio descriptions against timed human narration.
// Table 6 reports corpus CIDEr, retrieval, CRITIC and two language-model judgments for the test split.
import type { Leaderboard } from './types.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2404.14412';
const board: Leaderboard = {
  benchmark: 'cmd-ad-eval', static: 'paper', feed, url: feed,
  terms: 'The authors publish these results at https://www.robots.ox.ac.uk/~vgg/research/autoad/index.html.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.includes('CMD-AD-Eval') && t[0].includes('MAD-Eval'));
    if (!table || table[0][1] !== 'CMD-AD-Eval' || table[1].slice(1,4).join() !== 'CIDEr,R@1/5,CRITIC'
      || !table[1][4].startsWith('LLM-AD-Eval')) throw new Error('Missing Table 6 columns');
    const rows = table.slice(2).filter(r => r[1] !== '-').map(([label,cider,recall,critic,judges]) => {
      const values = [cider,recall,critic,...judges.split('/').map(v => v.trim())];
      if (values.length !== 5 || !values.every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid CMD-AD-Eval row');
      const [score, recallAt1of5, criticScore, gpt35Judge, llama2Judge] = values.map(Number);
      const model = label.replace(/\s*\[.*?\]|\s*\((?:ours|no ft)\)/g,'').trim();
      return {model, score, ...(label.includes('(no ft)') ? {setting:'No AD fine-tuning'} : {}),
        metrics: {recallAt1of5, critic: criticScore, gpt35Judge, llama2Judge}};
    });
    return checked(rows,5);
  },
};
export default board;
