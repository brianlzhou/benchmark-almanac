// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// LogicVal tests whether an image satisfies logical constraints. Table 3 reports human-verified success rates.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2610.24051';
const parts = ['1SAT', '3SAT', '6SAT'];
const models = ['GPT-Image-2', 'Gemini-3-Pro-Image', 'FLUX.1-dev', 'Qwen-Image'];
const settings = ['Low quality, 1024 × 1024', '1K resolution', 'LoRA, 28 steps, guidance 3.5', 'LoRA, 50 steps, true CFG 4.0'];
const board: Leaderboard = {
  benchmark: 'logicval', feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: Object.fromEntries(parts.map(part => [part, part])),
  headline: 'The paper reports no overall score, so the headline is the plain mean of the three package success rates.',
  async fetch() {
    const paper = await paperHtml(feed);
    const figure = paper.match(/<figure\b[^>]*\bid="[^"]*\.T3"[\s\S]*?<\/figure>/)?.[0];
    if (!figure?.includes('Success rate per model and package')) throw Error('Missing Table 3');
    const table = paperTables(figure).map(grid).find(t => t[0]?.join('|') === '|GPT|Gemini|Flux|QwenImage');
    if (!table || !parts.every((p, i) => table[i + 1]?.[0] === p)) throw Error('LogicVal packages changed');
    return checked(models.map((model, i) => {
      const rates = parts.map((_, j) => {
        const cell = table[j + 1][i + 1];
        if (!/^[01]\.\d+$/.test(cell)) throw Error('Invalid success rate for ' + model);
        return 100 * Number(cell);
      });
      return { model, setting: settings[i], score: rates.reduce((a, b) => a + b, 0) / rates.length,
        metrics: Object.fromEntries(parts.map((p, j) => [p, rates[j]])) };
    }), 4);
  },
};
export default board;
