// VIF-Bench evaluates visual instruction following in multi-reference image generation. Table 2 averages six criteria scored by GPT-5 and Gemini 2.5 Flash.
// Table 4 provides the same criteria and average from the independent Qwen3-VL judge.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2609.37709';
const criteria = ['Text Instruction Following','Reference Consistency','Visual Instruction Adherence','Visual Instruction Cleanliness','Scene Coherence','Visual Quality'];
const board: Leaderboard = {
  benchmark: 'vif-bench', url: feed, feed, static: 'paper',
  terms: 'The authors publish the tables under the terms at https://arxiv.org/abs/2609.37709.',
  stats: { alternateJudge: { name: 'Qwen3-VL judge average', unit: 'score', better: 'higher', note: 'Average across the six visual instruction following criteria from the independent Qwen3-VL judge.' } },
  aliases: { 'Qwen-Image-2511': 'qwen-image-edit-2511', 'Qwen-Image-2509': 'qwen-image-edit-2509', 'Nano Banana': 'gemini-2-5-flash-image-preview-nano-banana' },
  async fetch() {
    const header = ['Model', ...criteria, 'Avg.'].join('|');
    const tables = paperTables(await paperHtml(feed)).map(grid).filter(t => t[0]?.join('|') === header);
    const [main, alternate] = tables;
    if (!main || !alternate || main.length !== alternate.length) throw new Error('VIF-Bench judge tables missing');
    const parts: Record<string,string> = {};
    let model = '';
    const rows = main.slice(1).map((r,i) => {
      const other = alternate[i+1];
      if (r[0] !== other[0]) throw new Error('VIF-Bench judge rows differ');
      const multi = r[0] === '+ multi-step';
      if (!multi) model = r[0];
      const metrics: Record<string,number> = { alternateJudge: numberCell(other[7]) };
      criteria.forEach((label,j) => {
        const key = label.replaceAll(' ','');
        parts[key] = label;
        parts['qwen'+key] = 'Qwen3-VL: ' + label;
        metrics[key] = numberCell(r[j+1]);
        metrics['qwen'+key] = numberCell(other[j+1]);
      });
      return { model, score: numberCell(r[7]), setting: multi ? 'Multi-step' : undefined, metrics };
    });
    board.parts = parts;
    return checked(rows,10);
  },
};
export default board;
