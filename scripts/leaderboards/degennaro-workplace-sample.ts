// Workplace assistants complete four tasks against simulated company tools.
// The Harbor Hub README reports mean pass@1 over three runs per task and a second harness for Grok.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://hub.harborframework.com/datasets/doe/degennaro-workplace-sample';
const tasks = ['aver-yaws-client-message', 'bug-window-orgs-for-jenny', 'crm-followups-past-due', 'hollahan-voided-invoice'];
function ratio(cell: string) {
  const match = cell.match(/(\d+)\s*(?:\/|of)\s*(\d+)$/);
  if (!match || !Number(match[2])) throw new Error('Invalid workplace pass fraction: ' + cell);
  return 100 * Number(match[1]) / Number(match[2]);
}
const board: Leaderboard = {
  benchmark: 'degennaro-workplace-sample', url, feed: url,
  terms: 'The README publishes these results. The underlying tasks require a license. https://hub.harborframework.com/terms',
  parts: Object.fromEntries(tasks.map(t => [t, t])),
  stats: {
    reward: { name: 'Mean reward', unit: 'score', better: 'higher' }, reliable: { name: 'Tasks passed in every run', unit: 'count' },
    spreadMin: { name: 'Minimum run pass rate', unit: '%' }, spreadMax: { name: 'Maximum run pass rate', unit: '%' },
    calls: { name: 'Median tool calls', unit: 'count' }, minutes: { name: 'Median run time', unit: 'minutes' },
    medianCost: { name: 'Median model cost per run', unit: 'usd' },
    scored: { name: 'Scored runs', unit: 'count' }, missing: { name: 'Missing runs', unit: 'count' },
  },
  async fetch() {
    const all = tables(await fetchText(url)).map(t => t.map(r => r.map(c => c.text)));
    function table(header: string) {
      const t = all.find(t => t[0].join('|') === header);
      if (!t) throw new Error('Missing workplace table: ' + header);
      return t;
    }
    const main = table('Model|Agent|Effort|pass@1 (mean of runs)|Tasks passed in every run|Run spread|Mean reward|Scored / missing');
    const names = main.slice(1).map(r => r[0]).join('|');
    const breakdown = table('Task|' + names);
    const resources = table('Per run (median)|' + names);
    const links = table('Model|Agent|Runs');
    function cell(t: string[][], label: string, column: number) {
      const v = t.slice(1).find(r => r[0] === label)?.[column];
      if (!v) throw new Error('Missing workplace value: ' + label);
      return v;
    }
    const rows: LeaderboardRow[] = main.slice(1).map(([model, harness, setting, pass, reliable, spread, reward, counts], index) => {
      const column = index + 1;
      const [min, max] = spread.split(' to ').map(Number);
      const [scored, missing] = counts.split(' / ').map(Number);
      const metrics: Record<string,number> = { reward: Number(reward), reliable: parseInt(reliable), spreadMin: 100*min, spreadMax: 100*max,
        scored, missing, calls: Number(cell(resources, 'Tool calls', column)), minutes: Number(cell(resources, 'Minutes', column)) };
      const cost = cell(resources, 'Model cost', column);
      if (cost !== 'not metered') metrics.medianCost = Number(cost.replace(/^\$/, ''));
      tasks.forEach(task => { metrics[task] = ratio(cell(breakdown, task, column)); });
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid workplace metrics');
      return { model, harness, setting, score: 100 * Number(pass), trials: 3, link: cell(links, model, 2), metrics };
    });
    const second = table('Grok 4.7|Grok Build|terminus-2');
    rows.push({ model: second[0][0], harness: second[0][2], score: ratio(cell(second, 'Runs passed', 2)), trials: 3,
      link: links.find(r => r[1] === 'terminus-2')?.[2],
      metrics: Object.fromEntries(tasks.map(task => [task, ratio(cell(second, task, 2))])) });
    return checked(rows, 4);
  },
};
export default board;
