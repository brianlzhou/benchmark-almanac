// CADTestBench checks generated solids against executable requirements. Its results table gives the percentage passing every test for each prompt style.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://dimitrismallis.github.io/cadtests/#results";

const board: Leaderboard = {
  benchmark: "cadtestbench",
  url: "https://dimitrismallis.github.io/cadtests/#results",
  feed,
  terms: "The project licenses its website under CC BY-SA 4.0. The dataset card states MIT. https://dimitrismallis.github.io/cadtests/ https://huggingface.co/datasets/dimitrismallis/CADTestBench The feed host publishes robots.txt at https://dimitrismallis.github.io/robots.txt.",
  aliases: {"Claude-4.6-Sonnet": "claude-sonnet-4-6"},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === 'Method|Planner|Detailed|Abstract');
    if (!table || table[1].map(c => c.text.split(/\s/)[0]).join('|') !== 'IR|RS|PR|IR|RS|PR') throw new Error('Missing prompt comparison');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      if (cells.length === 1) continue;
      if (cells.length !== 8) throw new Error('Incomplete method row');
      const [method, planner, ...values] = cells.map(c => c.text.replace('&ndash;', '–'));
      for (const [i, setting] of ['Detailed', 'Abstract'].entries()) {
        const [invalid, requirements, score] = values.slice(i * 3, i * 3 + 3).map(v => Number.parseFloat(v) * 100);
        if (![invalid, requirements, score].every(Number.isFinite)) throw new Error('Invalid pass rate');
        rows.push({ model: planner === '–' ? method : planner, harness: planner === '–' ? undefined : method, setting, score, metrics: { invalid, requirements } });
      }
    }
    if (rows.length < 30) throw new Error('Incomplete CADTestBench results');
    return rows;
  },
};
export default board;
