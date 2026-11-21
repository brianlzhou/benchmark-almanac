// CFDCodeBench V2 tests one-attempt numerical solvers on 24 PDE problems.
// The results page’s embedded JSON gives success, execution, error and convergence measures for the revised tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { jsonAfter } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/nithinsomu/cfdllmbench_v2/main/index.html";

const board: Leaderboard = {
  benchmark: "cfdcodebench-2",
  url: "https://nithinsomu.github.io/cfdllmbench_v2/#results",
  feed,
  terms: "The benchmark repository uses BSD 3-Clause. The separate results site lists no score license. https://github.com/NLR-Theseus/cfdllmbench/blob/main/LICENSE The raw GitHub host serves no robots.txt.",
  aliases: { 'Llama 4 Maverick 17B Instruct': 'llama-4-maverick' },
  async fetch() {
    const html = await fetchText(feed);
    type Run = { name: string; cfdcodebench: Record<string,number> };
    const { v2_models } = jsonAfter<{ v2_models: Run[] }>(html, 'id="bench-data">');
    if (v2_models.length < 6) throw new Error('Missing CFDCodeBench V2 runs');
    return v2_models.map(({name, cfdcodebench: c}) => {
      const keys = ['execution_rate','nmse_score','convergence_rate','success_rate'];
      if (!name || keys.some(key => !Number.isFinite(c[key]))) throw new Error('Invalid CFDCodeBench V2 result');
      return { model: name.replace(/ \(effort=.+\)$/, ''), setting: name.match(/\((effort=[^)]+)\)/)?.[1],
        score: 100*c.success_rate, trials: 1, metrics: { executionRate: 100*c.execution_rate,
          nmseScore: 100*c.nmse_score, convergenceRate: 100*c.convergence_rate } };
    });
  },
};

export default board;
