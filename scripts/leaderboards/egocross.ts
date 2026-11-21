// EgoCross ranks video question answering teams by overall accuracy. Table 2 of the challenge report lists the top ten in each track.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://arxiv.org/html/2608.04589v1#S3.T2";

const board: Leaderboard = {
  benchmark: "egocross", static: 'paper',
  url: "https://egocross-benchmark.github.io/#challenge",
  feed,
  terms: "The organizers do not state separate score reuse terms on the challenge site. https://egocross-benchmark.github.io/ The feed host publishes robots.txt at https://arxiv.org/robots.txt.",
  parts: { surgery: "Surgery", industry: "Industry", xsports: "XSports", animal: "Animal Perspective" },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t.some(r => r.at(-1)?.text === 'Overall Accuracy'));
    if (!table) throw new Error('Missing challenge standings');
    let setting = '';
    const rows: LeaderboardRow[] = [];
    for (const cells of table) {
      if (cells.length === 1) { setting = cells[0].text; continue; }
      const [rank, model, ...values] = cells.map(c => c.text);
      if (rank === 'Rank') {
        if (values.join('|') !== 'Surgery|Industry|XSports|Animal Perspective|Overall Accuracy') throw new Error('Unexpected columns');
        continue;
      }
      const [surgery, industry, xsports, animal, score] = values.map(Number.parseFloat);
      if (!model || ![surgery, industry, xsports, animal, score].every(Number.isFinite)) throw new Error('Invalid entry');
      rows.push({ model, setting, submitter: model, score, metrics: { surgery, industry, xsports, animal } });
    }
    if (rows.length < 20) throw new Error('Incomplete challenge standings');
    return rows;
  },
};
export default board;
