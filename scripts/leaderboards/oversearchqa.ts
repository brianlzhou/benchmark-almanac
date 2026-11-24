// OverSearchQA tests when to answer and when to abstain. Table 2 gives both accuracies.
// Appendix A defines overall accuracy as the "average between abstention accuracy and answer accuracy".
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2601.05503";
const board: Leaderboard = {
  benchmark: "oversearchqa",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2601.05503",
  aliases: { 'GPT-4o-mini (snapshot unspecified)': 'gpt-4o-mini', 'Qwen3-235B-Instruct': 'qwen3-235b-a22b-instruct-jul-2025', 'Qwen3-235B-Think': 'qwen3-235b-a22b-thinking-jul-2025' },
  headline: 'Overall accuracy is the average of answer accuracy and abstention accuracy.',
  parts: { answer: 'Answerable', abstain: 'Unanswerable' },
  stats: { tpc: { name: 'Tokens per correctness', unit: 'tokens', better: 'lower' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0][1] === 'Answer Unknown' && t[0][7] === 'Underspecified Context' && t[0][10] === 'Overall');
    if (!t || t[1].slice(10).join('|') !== 'Ans.|Abst.|TPC') throw new Error('Missing Table 2 results');
    const rows: LeaderboardRow[] = [];
    let setting = '';
    for (const r of t.slice(2)) {
      const model = r[0];
      if (r[1] === model) { setting = model; continue; }
      if (model === 'Average') continue;
      const [answer, abstain, tpc] = r.slice(10).map(Number);
      const metrics: Record<string,number> = { answer, abstain, tpc };
      for (const i of [1,4,7]) {
        const group = t[0][i];
        for (const [offset,label] of ['Answer accuracy','Abstention accuracy','Tokens per correctness'].entries()) {
          const key = group + ' ' + label;
          metrics[key] = Number(r[i+offset]);
          board.parts![key] = { name: label, group, ...(offset === 2 ? { unit: 'score', better: 'lower', note: 'Tokens per correct response.' } : {}) };
        }
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid OverSearchQA result');
      rows.push({ model, setting, score: (answer+abstain)/2, metrics });
    }
    return checked(rows, 18);
  },
};
export default board;
