// CodePDE tests whether generated solvers generalize across instances in five PDE families.
// The Harbor adapter comparison reports whole-benchmark pass rates for each agent, execution platform and run count.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/harbor-framework/harbor/HEAD/adapters/codepde/README.md';
const board: Leaderboard = {
  benchmark: 'codepde', host: 'Harbor', url: 'https://github.com/harbor-framework/harbor/tree/main/adapters/codepde', feed,
  terms: 'Harbor publishes its comparison under the repository license. https://github.com/harbor-framework/harbor/blob/main/LICENSE',
  async fetch() {
    const section = (await fetchText(feed)).split('## Comparison with Original Benchmark (Parity)')[1]?.split('## Notes')[0];
    if (!section) throw new Error('Missing CodePDE comparison');
    const rows: LeaderboardRow[] = [];
    let platforms: string[] = [];
    for (const line of section.split('\n').filter(l=>l.startsWith('|'))) {
      const c = line.split('|').slice(1,-1).map(s=>s.trim());
      if (c[0] === 'Agent') {
        if (c[3] !== 'Number of Runs' || c[4] !== 'Dataset Size') throw new Error('Comparison headers changed');
        platforms = c.slice(5).map(s=>s.replace(' Performance',''));
        continue;
      }
      if (c[0].startsWith('---')) continue;
      if (c[2] !== 'Pass rate' || !c[4].includes('100% of full set')) throw new Error('Only whole-set pass rates are supported');
      const trials = c[3].split('/').map(s=>Number(s.trim().match(/^\d+/)?.[0]));
      platforms.forEach((setting,i) => {
        const m = /^([\d.]+)% ± ([\d.]+)%$/.exec(c[i+5]);
        if (!m || !Number.isFinite(trials[i] ?? trials[0])) throw new Error('Incomplete parity row');
        rows.push({ model:c[1], harness:c[0], setting, trials:trials[i] ?? trials[0], score:Number(m[1]), metrics:{std:Number(m[2])} });
      });
    }
    return checked(rows,4);
  },
};
export default board;
