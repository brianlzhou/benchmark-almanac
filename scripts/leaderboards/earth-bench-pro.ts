// Earth-Bench-Pro tests agents that acquire and analyze Earth observations. Tables II and VI
// give judged answer accuracy and tool-use metrics on the 248 Open-World Execution questions.
// The two fine-tuned Qwen entries use the paper's trained planner and executor adapters.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2609.12533';
const headers = ['LLM-as- Judge','ROUGE-L','EM','Efficiency','TAO','TIO','TEM','Param.'];
const keys = ['judge','rougeL','em','efficiency','tao','tio','tem','param'];
const board: Leaderboard = {
  benchmark: 'earth-bench-pro', static: 'paper', url: feed, feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  harnesses: 'system', headline: 'The headline is judged answer accuracy on the 248 Open-World Execution questions.',
  aliases: { 'Claude-4.6-sonnet':'claude-sonnet-4-6', 'Gemma-4 (E4B-it)':'gemma-4-e4b-it', 'Gemma-4 (26B-A4B-it)':'gemma-4-26b-a4b' },
  parts: { rougeL: 'ROUGE-L', em: 'Exact Match', tao: 'Tools in Any Order', tio: 'Tools in Order',
    tem: 'Tool Exact Match', param: 'Parameter Accuracy' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const rows: LeaderboardRow[] = [];
    for (const label of ['Model','Framework']) {
      const table = tables.find(t => t[0].join('|') === [label,...headers].join('|'));
      if (!table) throw Error('Missing results by ' + label);
      for (const [name,...cells] of table.slice(1)) {
        if (label === 'Framework' && name === 'Earth-Agent-Pro') continue;
        if (cells.length !== keys.length || cells.some(c => !c || !Number.isFinite(Number(c)))) throw Error('Invalid result for ' + name);
        const metrics = Object.fromEntries(keys.map((key,i) => [key, Number(cells[i])]));
        const tuned = name.match(/^Ours \((4B|9B), fine-tuned\)$/);
        const model = label === 'Framework' ? 'GPT-5' : tuned ? 'Qwen3.5-' + tuned[1] : name;
        rows.push({ model, harness: label === 'Model' ? 'Earth-Agent-Pro' : name, score: metrics.judge, metrics,
          ...(tuned ? { setting: 'Fine-tuned planner and executor' } : {}) });
      }
    }
    return checked(rows, 23);
  },
};
export default board;
