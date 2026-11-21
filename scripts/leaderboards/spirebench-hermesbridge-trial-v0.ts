// SpireBench ranks five-character Slay the Spire 2 trials by median floor. The trial report publishes aggregate statistics for each model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const feed = "https://www.spirebench.com/blog/trial-v0-results";

const board: Leaderboard = {
  benchmark: "spirebench-hermesbridge-trial-v0",
  url: "https://www.spirebench.com/blog/trial-v0-results",
  feed,
  terms: "The repository includes an MIT license. https://github.com/hiKareeem/ClaudePlaysTheSpire/blob/main/LICENSE The feed host returns no robots.txt.",
  stats: { maxFloor: { name: 'Maximum floor', unit: 'count', better: 'higher' }, meanTotalTokens: { name: 'Mean total tokens', unit: 'tokens', better: 'lower' }, meanHours: { name: 'Mean wall time', unit: 'hours', better: 'lower' } },
  async fetch() {
    const required = ["Model", "Median Floor"];
    const table = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text)))
      .find(([header]) => header && required.every(name => header.includes(name)));
    if (!table || table.length <= 5) throw new Error('Incomplete score table');
    const [header, ...entries] = table;
    return entries.map(cells => {
      const cell = (name: string) => cells[header.indexOf(name)];
      const model = cell("Model");
      const score = num(cell("Median Floor"));
      if (!model || score === undefined) throw new Error('Missing model or headline score');
      const row: LeaderboardRow = { model, score };
      row.trials = num(cell('Runs'));
      row.harness = 'HermesBridge';
      row.setting = 'A0-zero-shot';
      row.metrics = { victories: Number(cell('Victories')), maxFloor: Number(cell('Max Floor')),
        meanTotalTokens: Number(cell('Mean Tokens').replace(/M$/, '')) * 1e6, meanHours: Number(cell('Mean Wall (h)')) };
      return row;
    });
  },
};
export default board;
