// The source reports no overall score. The headline is the plain mean of the 49 parts, computed by this importer.
// Table 5 and Appendix Tables 12 to 20 report attack success value (ASV) for the same evaluation condition.
// Each part is a target and injected task pair. A higher ASV indicates poorer resistance to conflicting instructions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2310.12815';
const models = ['GPT-4','PaLM 2 text-bison-001','GPT-3.5-Turbo','Bard','Vicuna-33b-v1.3','Flan-UL2',
  'Llama-2-13b-chat','Vicuna-13b-v1.3','Llama-2-7b-chat','InternLM-chat-7b'];
const TASKS = [
  'Duplicate sentence detection', 'Grammar correction', 'Hate detection',
  'Natural language inference', 'Sentiment analysis', 'Spam detection', 'Summarization',
];
const PARTS: NonNullable<Leaderboard['parts']> = Object.fromEntries(
  TASKS.flatMap((t, i) => TASKS.map((inj, j) => [
    'target' + (i + 1) + 'Injected' + (j + 1),
    { name: t + ' / ' + inj, unit: '%' as const, better: 'lower' as const },
  ])),
);
const board: Leaderboard = {
  benchmark: 'open-prompt-injection', static: 'paper', url: feed, feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { "Llama-2-13b-chat": "llama-2-13b", "Llama-2-7b-chat": "llama-2-7b" },
  headline: 'The headline is mean attack success value across 49 task pairs, expressed as a percentage. Lower values indicate better resistance.',
  parts: PARTS,
  stats: { matchRate: { name: 'Matching rate', unit: '%', better: 'lower', note: 'Mean agreement between attacked output and direct injected-task output across 49 task pairs.' } },
  async fetch() {
    const paper = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const [i, model] of models.entries()) {
      const id = i === 0 ? 'S6.T5' : 'A1.T' + (11+i);
      const figure = paper.split('<figure id="' + id + '"')[1]?.split('</figure>')[0];
      const table = figure && flatPaperTables(figure).map(grid)[0];
      if (!table || table.length !== 10 || table[2].filter(c => c === 'ASV').length !== 7) throw Error('Missing paired task table ' + id);
      const metrics: Record<string,number> = {};
      let asv = 0, matchRate = 0;
      for (const [target, row] of table.slice(3).entries()) {
        for (let j = 0; j < 7; j++) {
          const col = 2 + 3*j;
          if (table[2][col] !== 'ASV' || table[2][col+1] !== 'MR') throw Error('Metric columns changed');
          const key = 'target' + (target+1) + 'Injected' + (j+1);
          metrics[key] = 100 * numberCell(row[col]);
          asv += metrics[key];
          matchRate += 100 * numberCell(row[col+1]);
        }
      }
      metrics.matchRate = matchRate / 49;
      rows.push({ model, score: asv/49, setting: 'Combined Attack', metrics });
    }
    return checked(rows, 10);
  },
};
export default board;
