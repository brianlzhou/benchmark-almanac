// LMArcade ranks game builds by direct Elo from player votes. Its default standings list each model and coding harness combination.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const feed = "https://www.lmarcade.com/leaderboard";

const board: Leaderboard = {
  benchmark: "lmarcade-afterquery",
  url: "https://www.lmarcade.com/leaderboard",
  feed,
  terms: "The publisher does not specify separate score reuse terms in the supplied source. The feed host returns no robots.txt.",
  harnesses: 'system',
  async fetch() {
    const required = ["Model", "Elo"];
    const table = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text)))
      .find(([header]) => header && required.every(name => header.includes(name)));
    if (!table || table.length <= 229) throw new Error('Incomplete score table');
    const [header, ...entries] = table;
    return entries.map(cells => {
      const cell = (name: string) => cells[header.indexOf(name)];
      const model = cell("Model");
      const score = num(cell("Elo"));
      if (!model || score === undefined) throw new Error('Missing model or headline score');
      const row: LeaderboardRow = { model, score };
      const effort = model.match(/\(\s*(low|medium|high|xhigh)\s*\)$/i);
      if (effort) {
        row.model = model.slice(0, effort.index).trim();
        row.setting = effort[1];
      }
      row.harness = cell('Harness');
      row.agentOrg = cell('Harness Org');
      return row;
    });
  },
};
export default board;
