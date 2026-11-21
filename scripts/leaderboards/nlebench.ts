// NLEBench evaluates Norwegian conversation, summarization, question answering and other language tasks.
// The results use different metrics and directions. The headline is conversation BLEU, first in Table 2.
// Tables 2 to 5 and 13 to 16 supply the other published task scores for these models.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2312.01314';
const specs = [
  ['S5.T2', 'Conversation', 'Metrics/Models', 1, 5],
  ['S5.T3', 'News summarization', 'Metrics/Models', 1, 5],
  ['S5.T4', 'NO-Multi-QA-Sum summarization', 'Datasets', 2, 12],
  ['S5.T5', 'NO-Multi-QA-Sum question answering', 'Datasets', 2, 12],
  ['A4.T13', 'Instruction finetuning', 'Metrics/Models', 1, 6],
  ['A4.T14', 'Natural language understanding', 'Datasets', 2, 6],
  ['A4.T15', 'Toxicity', 'Metrics/Models', 1, 6],
  ['A4.T16', 'Bias', 'Bias types/Models', 1, 10],
] as const;
const board: Leaderboard = {
  benchmark: 'nlebench', static: 'paper', feed, url: feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper reports no overall score, so the headline uses conversation BLEU, the first result in Table 2.',
  async fetch() {
    const html = await paperHtml(feed);
    const byModel = new Map<string, LeaderboardRow>();
    const parts: Record<string, BoardPart> = {};
    for (const [id, task, firstColumn, offset, height] of specs) {
      const figure = html.split('<figure id="' + id + '"')[1]?.split('</figure>')[0];
      const t = figure && flatPaperTables(figure).map(grid)[0];
      const paired = id === 'S5.T4' || id === 'S5.T5';
      if (!t || t[0][0] !== firstColumn || t.length !== height + (paired ? 2 : 1)) throw Error('Missing ' + task + ' table');
      let subset = '';
      for (const cells of t.slice(paired ? 2 : 1)) {
        if (offset === 2 && cells[0]) subset = cells[0];
        const metric = cells[offset - 1];
        for (let col = offset; col < t[0].length; col++) {
          const model = t[0][col];
          const value = numberCell(cells[col]);
          if (id === 'S5.T2' && metric === 'BLEU') byModel.set(model, { model, score: value, metrics: {} });
          const row = byModel.get(model);
          if (!row) continue;
          const label = [task, subset, paired ? t[1][col] : '', metric].filter(Boolean).join(' ');
          const key = label.replace(/[^A-Za-z0-9]/g, '');
          parts[key] = { name: label, unit: 'score' };
          if (task === 'Toxicity' || metric === 'PPL') parts[key].better = 'lower';
          row.metrics![key] = value;
        }
      }
    }
    board.parts = parts;
    return checked([...byModel.values()], 7);
  },
};
export default board;
