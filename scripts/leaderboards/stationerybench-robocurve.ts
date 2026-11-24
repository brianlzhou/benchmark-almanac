// StationeryBench evaluates bimanual robot policies on five desk-stationery tasks.
// The headline score is mean progress on the site's 0 to 100 grading scale.
// Reads the published HTML report, all five per-task progress scores, completion rate, never-left-start-pose rate,
// mean calls per run, output tokens and estimated cost per run.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://openai.robocurve.org/stationerybench/';
const TASK_KEYS: Record<string, string> = {
  'Uncap the marker': 'uncapMarker',
  'Pour paper clips into a lifted bowl': 'pourPaperClips',
  'Hand a ruler between arms, cup to cup': 'handRuler',
  'Pull the middle sticky note from a stack': 'pullStickyNote',
  'Open the box, take out an eraser, close the lid': 'openBoxEraser',
};

const board: Leaderboard = {
  benchmark: 'stationerybench-robocurve',
  url: PAGE,
  feed: PAGE,
  static: 'paper',
  terms: 'Robocurve publishes this report and its benchmark results. Separate score reuse terms are not stated.',
  parts: {
    uncapMarker: { name: 'Uncap the marker', group: 'Task', unit: 'score' },
    pourPaperClips: { name: 'Pour paper clips into a lifted bowl', group: 'Task', unit: 'score' },
    handRuler: { name: 'Hand a ruler between arms, cup to cup', group: 'Task', unit: 'score' },
    pullStickyNote: { name: 'Pull the middle sticky note from a stack', group: 'Task', unit: 'score' },
    openBoxEraser: { name: 'Open the box, take out an eraser, close the lid', group: 'Task', unit: 'score' },
  },
  stats: {
    completion: { name: 'Completion rate', unit: '%', better: 'higher', note: 'Share of trials that reached the 100-point task completion score.' },
    neverLeftStart: { name: 'Never left start pose', unit: '%', better: 'lower' },
    callsPerRun: { name: 'Mean calls per run', unit: 'count', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const headline = html.match(/mean progress (\d+) vs (\d+) out of 100/);
    const completion = html.match(/Astra completed (\d+) of 100 trials[^<]*, MolmoAct2 completed none/);
    if (!headline || !completion) throw new Error('StationeryBench: headline results missing');
    const resultTable = tables(html).find(
      (t) => t[0]?.map((c) => c.text).join('|') === 'Task|Model|n|Mean progress (0-100)|Completions|Rate|Never left start pose|Calls/run|Output tokens/run|Est. cost/run',
    );
    if (!resultTable) throw new Error('StationeryBench: results table missing');

    const costs = new Map<string, number[]>();
    const outputs = new Map<string, number[]>();
    const calls = new Map<string, number[]>();
    const neverLeft = new Map<string, { num: number; den: number }>();
    const taskScores = new Map<string, Record<string, number>>();

    for (const cells of resultTable.slice(1)) {
      const task = cells[0]?.text.trim();
      const model = cells[1]?.text.trim();
      if (!task || !model) continue;
      const key = TASK_KEYS[task];
      const prog = num(cells[3]?.text);
      if (key && prog !== undefined) {
        const cur = taskScores.get(model) ?? {};
        cur[key] = prog;
        taskScores.set(model, cur);
      }
      const nl = cells[6]?.text.match(/^(\d+)\/(\d+)$/);
      if (nl) {
        const cur = neverLeft.get(model) ?? { num: 0, den: 0 };
        cur.num += Number(nl[1]);
        cur.den += Number(nl[2]);
        neverLeft.set(model, cur);
      }
      const callVal = num(cells[7]?.text);
      if (callVal !== undefined) calls.set(model, [...(calls.get(model) ?? []), callVal]);
      const output = num(cells[8]?.text);
      if (output !== undefined) outputs.set(model, [...(outputs.get(model) ?? []), output]);
      const cost = num(cells[9]?.text);
      if (cost !== undefined) costs.set(model, [...(costs.get(model) ?? []), cost]);
    }
    const average = (values: number[] | undefined) => (values?.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined);
    const nlPct = (model: string) => {
      const cur = neverLeft.get(model);
      return cur && cur.den > 0 ? Number(((100 * cur.num) / cur.den).toFixed(2)) : undefined;
    };

    const astraMetrics: Record<string, number> = { ...(taskScores.get('GPT-6 Astra') ?? {}), completion: Number(completion[1]) };
    const astraNl = nlPct('GPT-6 Astra');
    if (astraNl !== undefined) astraMetrics.neverLeftStart = astraNl;
    const astraCalls = average(calls.get('GPT-6 Astra'));
    if (astraCalls !== undefined) astraMetrics.callsPerRun = Number(astraCalls.toFixed(2));

    const molmoMetrics: Record<string, number> = { ...(taskScores.get('MolmoAct2') ?? {}), completion: 0 };
    const molmoNl = nlPct('MolmoAct2');
    if (molmoNl !== undefined) molmoMetrics.neverLeftStart = molmoNl;

    return [
      { model: 'GPT-6 Astra', score: Number(headline[1]), trials: 100, cost: average(costs.get('GPT-6 Astra')), tokens: average(outputs.get('GPT-6 Astra')), metrics: astraMetrics },
      { model: 'MolmoAct2', score: Number(headline[2]), trials: 100, metrics: molmoMetrics },
    ];
  },
};
export default board;
