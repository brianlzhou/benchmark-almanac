// LlamaTouch tests mobile agents on complete Android tasks.
// Tables 9 and 10 give overall completion rates and results by source and step count.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2404.16054';
const names = ['AITW', 'Generated', '4 steps or fewer', '5 to 8 steps', 'More than 8 steps'];
// The paper names the model behind two of its agents (section 5). CoCo-Agent is a LLaVA model the authors of
// CoCo-Agent fine-tuned on AITW, so it is a model of its own and keeps its name.
const backends = new Map([
  ['AutoDroid', 'gpt-4-0125-preview'],
  ['AppAgent', 'GPT-4V'],
]);
export default {
  benchmark: 'llamatouch', url: feed, feed, static: 'paper',
  harnesses: 'system',
  terms: 'Paper and license at https://arxiv.org/abs/2404.16054',
  parts: Object.fromEntries(names.map(name => [name, {name, unit: '%' as const}])),
  async fetch() {
    const html = (await paperHtml(feed)).replace(/alttext="&lt;"/g, 'alttext=" less than "');
    const tables = paperTables(html).map(grid);
    const source = tables.find(t => t[1]?.join('|') === 'Agent|Overall|AITW|Generated');
    const length = tables.find(t => t[1]?.[0] === 'Agent' && t[1]?.length === 5 && t[1][2].startsWith('Steps') &&
      t[1][3].includes('less than') && t[1][4] === 'Steps>8');
    if (!source || !length) throw new Error('Missing completion rates by source or step count');
    return checked(source.slice(2).map(([model, overall, aitw, generated]) => {
      const row = length.find(r => r[0] === model);
      if (!row || row[1] !== overall) throw new Error('Conflicting completion rate for ' + model);
      const values = [aitw, generated, ...row.slice(2)];
      const backend = backends.get(model);
      return {model: backend ?? model, ...(backend ? {harness: model} : {}),
        score: numberCell(overall), metrics: Object.fromEntries(names.map((n,i) => [n, numberCell(values[i])]))};
    }), 4);
  },
} satisfies Leaderboard;
