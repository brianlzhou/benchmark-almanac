// StationeryBench evaluates bimanual robot policies on five desk-stationery tasks.
// The headline score is mean progress on the site's 0 to 100 grading scale.
// The importer reads the published HTML report and its headline results text.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://openai.robocurve.org/stationerybench/';
const board: Leaderboard = {
  benchmark: 'stationerybench-robocurve', url: PAGE, feed: PAGE,
  terms: 'Robocurve publishes this report and its benchmark results. Separate score reuse terms are not stated.',
  parts: { completion: { name: 'Completion rate', group: 'Outcome', note: 'Share of trials that reached the 100-point task completion score.' } },
  async fetch() {
    const html = await fetchText(PAGE);
    const headline = html.match(/mean progress (\d+) vs (\d+) out of 100/);
    const completion = html.match(/Astra completed (\d+) of 100 trials[^<]*, MolmoAct2 completed none/);
    if (!headline || !completion) throw new Error('StationeryBench: headline results missing');
    const resultTable = tables(html).find(t => t[0]?.map(c => c.text).join('|') === 'Task|Model|n|Mean progress (0-100)|Completions|Rate|Never left start pose|Calls/run|Output tokens/run|Est. cost/run');
    if (!resultTable) throw new Error('StationeryBench: results table missing');
    const costs = new Map<string, number[]>(), outputs = new Map<string, number[]>();
    for (const cells of resultTable.slice(1)) {
      const model = cells[1]?.text;
      const output = num(cells[8]?.text), cost = num(cells[9]?.text);
      if (!model) continue;
      if (output !== undefined) outputs.set(model, [...(outputs.get(model) ?? []), output]);
      if (cost !== undefined) costs.set(model, [...(costs.get(model) ?? []), cost]);
    }
    const average = (values: number[] | undefined) => values?.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
    const cost = average(costs.get('GPT-6 Astra'));
    const tokens = average(outputs.get('GPT-6 Astra'));
    return [
      { model: 'GPT-6 Astra', score: Number(headline[1]), trials: 100, cost, tokens, metrics: { completion: Number(completion[1]) } },
      { model: 'MolmoAct2', score: Number(headline[2]), trials: 100, metrics: { completion: 0 } },
    ];
  },
};
export default board;
