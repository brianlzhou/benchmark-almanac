// Legal Consent Sweep scores acquisition consent reviews. The authors average the three counted trials for each agent.
// The importer reads the authors' HTML results table and ranks by Mean.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://hub.harborframework.com/datasets/doe/legal-consent-sweep";
const board: Leaderboard = {
  benchmark: "legal-consent-sweep", url: "https://hub.harborframework.com/datasets/doe/legal-consent-sweep?tab=leaderboard", feed,
  terms: "Public results published by the task author on Harbor Hub.",
  aliases: {"Sol 6.1": "gpt-6-1-sol"},
  async fetch() {
    const source = await fetchText(feed);
    const all = tables(source).map(t => t.map(row => row.map(c => c.text)));
    const table = all.find(t => t[0]?.join('|') === "Model|Trial scores|Mean|Agent time allowance");
    if (!table) throw new Error('Results columns changed');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[0];
      const number = (i: number) => {
        const raw = cells[i]?.trim().replace(/%$/, '');
        if (!raw || !Number.isFinite(Number(raw))) throw new Error(`Invalid score for ${model}`);
        return Number(raw);
      };
      rows.push({ model: model.split(' · ')[0], score: number(2), setting: [model.split(' · ')[1], cells[3]].filter(Boolean).join(' / '), trials: cells[1].split(',').length,
        metrics: Object.fromEntries(cells[1].split(',').map((trial, n) => ['trial' + (n + 1), Number.parseFloat(trial)])) });
    }
    if (rows.length < 4) throw new Error('Expected at least 4 published results');
    return rows;
  },
};
export default board;
