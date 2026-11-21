// CHED ranks historical event detectors by a weighted total for three tasks.
// The organizers publish the component scores and total in their final Markdown table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/NLPInBLCU/CHED2024/main/%E6%8E%92%E8%A1%8C%E6%A6%9C.md";
const board: Leaderboard = {
  benchmark: "ched",
  url: "https://github.com/NLPInBLCU/CHED2024/blob/main/%E6%8E%92%E8%A1%8C%E6%A6%9C.md",
  feed,
  terms: "The organizers publish team rankings without a separate reuse license. The raw file host has no robots.txt.",
  parts: {"triggers":"Trigger word recognition","coarse":"Coarse event type classification","fine":"Fine event type classification"},
  async fetch() {
    const source = await fetchText(feed);
    const headers = ["团队名称","任务1","任务2","任务3","总分"];
    const table = markdownTables(source).find(t => headers.every(h => t[0]?.includes(h)));
    if (!table) throw new Error('Missing results table');
    const records = table.slice(1).map(c => Object.fromEntries(table[0].map((h, i) => [h, c[i]])));
    const numeric = (s: string) => {
      const value = s?.replace(/%$/, '').trim();
      if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid result: ' + s);
      return Number(value);
    };
    const rows = records.map(r => {
      const model = r["团队名称"];
      if (!model) throw new Error('Missing model name');
      return { model, submitter: model, score: numeric(r["总分"]),
        metrics: { triggers: numeric(r["任务1"]), coarse: numeric(r["任务2"]), fine: numeric(r["任务3"]) } };
    });
    if (rows.length < 15) throw new Error('Incomplete results');
    return rows;
  },
};
export default board;
