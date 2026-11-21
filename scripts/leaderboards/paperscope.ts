// PaperScope evaluates research agents across multiple scientific papers. The authors' README
// reports total score and separate reasoning, induction, summary and solution results.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/CherYou/PaperScope/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'paperscope', url: 'https://github.com/CherYou/PaperScope', feed,
  terms: 'The authors identify the repository license as MIT at https://github.com/CherYou/PaperScope#readme.',
  parts: { reasoning: 'Reasoning', induction: 'Induction', summary: 'Summary', solution: 'Solution' },
  aliases: { 'OpenAI 4o-mini': 'gpt-4o-mini', 'OpenAI GPT-5.1': 'gpt-5-1' },
  async fetch() {
    const md = await fetchText(feed);
    const table = md.match(/^\| Agent 类型 \| 模型 \| Reasoning \| Induction \| Summary \| Solution \| 总分 \|\r?\n\|[-|]+\|\r?\n((?:\|[^\n]+\r?\n)+)/m);
    if (!table) throw new Error('PaperScope main results missing');
    let group = '';
    return checked(table[1].trim().split('\n').map(line => {
      const [type, model, ...cells] = line.trim().split('|').slice(1,-1).map(c => c.replace(/\*\*/g,'').trim());
      group = type || group;
      if (!group || !model || cells.length !== 5) throw new Error('Invalid PaperScope result');
      const [reasoning, induction, summary, solution, score] = cells.map(numberCell);
      return { model, harness: group === 'LLM-based ReAct' ? 'ReAct' : undefined, score, metrics: { reasoning, induction, summary, solution } };
    }),16);
  },
};
export default board;
