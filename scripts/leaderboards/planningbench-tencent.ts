// PlanningBench checks whether generated plans satisfy all constraints.
// Table 2 ranks models by All-pass and also reports the average fraction of constraints passed.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const feed = 'https://arxiv.org/html/2605.20873';
const board: Leaderboard = {
  benchmark: 'planningbench-tencent', static: 'paper', url: feed, feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: { avgPass: 'Avg-pass' },
  aliases: { 'Hy3-Preview': 'tencent-hy3-preview', 'Seed-2.0-pro': 'doubao-seed-2-0-pro',
    'Gemini-3-1-pro': 'gemini-3-1-pro', 'Qwen3-30b-moe': 'qwen3-30b-a3b' },
  async fetch() {
    const t = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Model|Type|Rank|All-pass (%) \\uparrow|Avg-pass (%) \\uparrow');
    if (!t) throw Error('Missing All-pass and Avg-pass results');
    return checked(t.slice(1).map(([label,type,,overall,average]) => {
      const mode = label.match(/^(.+)-(xhigh|high|medium|thinking)$/i);
      return { model: mode?.[1] ?? label, setting: mode?.[2], score: numberCell(overall),
        open: type === 'Open-source', metrics: { avgPass: numberCell(average) } };
    }), 18);
  },
};
export default board;
