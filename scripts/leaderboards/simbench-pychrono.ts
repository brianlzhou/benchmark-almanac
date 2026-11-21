// SimBench ranks PyChrono simulations by the reference-plus-documentation judge score. Its results table also gives two alternative judge scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://uwsbel.github.io/simbench-website/#results";

const board: Leaderboard = {
  benchmark: "simbench-pychrono",
  url: "https://uwsbel.github.io/simbench-website/#results",
  feed,
  terms: "The lab licenses the repository under BSD 3-Clause and the archived runs under CC BY 4.0. https://github.com/uwsbel/ChronoBench/blob/paper-ieee-access-2026/LICENSE https://zenodo.org/records/20974275 The feed host returns no robots.txt.",
  aliases: { "claude-4-sonnet": "claude-sonnet-4" },
  async fetch() {
    const table = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text)))
      .find(([h]) => h && ['#', 'Model', 'Ref+Doc', 'Ref', 'Doc', 'Weights'].every(c => h.includes(c)));
    if (!table) throw new Error('Missing SimBench table');
    const [header, ...entries] = table;
    const rows = entries.filter(r => /^\d+$/.test(r[header.indexOf('#')])).map(r => {
      const cell = (key: string) => r[header.indexOf(key)];
      const score = num(cell('Ref+Doc')), ref = num(cell('Ref')), doc = num(cell('Doc'));
      if (!cell('Model') || score === undefined || ref === undefined || doc === undefined) throw new Error('Incomplete SimBench score');
      return { model: cell('Model'), score, open: cell('Weights') === 'open', metrics: { ref, doc } };
    });
    if (rows.length < 12) throw new Error('Incomplete SimBench standings');
    return rows;
  },
};
export default board;
