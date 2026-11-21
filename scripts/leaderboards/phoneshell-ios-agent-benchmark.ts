// PhoneShell measures pass rate on the same 58 iPhone tasks. The published comparison table gives confidence intervals, steps, time and cost.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const feed = "https://blolabel.ai/#leaderboard";

const board: Leaderboard = {
  benchmark: "phoneshell-ios-agent-benchmark",
  url: "https://blolabel.ai/#leaderboard",
  feed,
  terms: "The dataset card lists Apache 2.0 for the downloadable results. https://huggingface.co/datasets/blolabel/phoneshell-bench The feed host publishes robots.txt at https://blolabel.ai/robots.txt.",
  async fetch() {
    const required = ["Model", "Pass rate"];
    const table = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text)))
      .find(([header]) => header && required.every(name => header.includes(name)));
    if (!table || table.length <= 6) throw new Error('Incomplete score table');
    const [header, ...entries] = table;
    return entries.map(cells => {
      const cell = (name: string) => cells[header.indexOf(name)];
      const model = cell("Model");
      const score = num(cell("Pass rate"));
      if (!model || score === undefined) throw new Error('Missing model or headline score');
      const row: LeaderboardRow = { model, score };
      const interval = cell('Pass rate')?.match(/CI\s+(\d+)(?:–|&ndash;|-)(\d+)/);
      if (!interval) throw new Error('Missing pass rate interval');
      row.low = +interval[1];
      row.high = +interval[2];
      row.cost = num(cell('Cost/task'));
      row.metrics = { steps: Number(cell('Avg steps')), latency: Number.parseFloat(cell('Avg time')), passed: Number.parseInt(cell('Passed')) };
      return row;
    });
  },
};
export default board;
