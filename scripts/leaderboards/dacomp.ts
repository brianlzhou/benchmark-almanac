// DAComp tests engineering and analysis agents on 210 enterprise data tasks.
// The paper defines Overall Score as "the mean across the entire benchmark." Table 2 gives 110 DE and 100 DA tasks.
// Tables 3 to 6 supply the track scores. The Chinese localization has its own metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2512.04324';
const board: Leaderboard = {
  benchmark: 'dacomp', feed, url: feed, static: 'paper',
  terms: 'The paper and its license are available at https://arxiv.org/abs/2512.04324.',
  headline: 'The headline weights the engineering and analysis scores by their task counts, 110 and 100.',
  parts: {},
  async fetch() {
    const html = await paperHtml(feed);
    const results = new Map<string, Record<string, number>>();
    for (const match of html.matchAll(/<figure\b[^>]*class="[^"]*ltx_table[^"]*"[^>]*>[\s\S]*?<\/figure>/g)) {
      const caption = match[0].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1].replace(/<[^>]+>/g, '');
      const n = Number(caption?.match(/Table\s+([3-6])\s*:/)?.[1]);
      if (!n) continue;
      const table = grid(paperTables(match[0])[0]);
      const de = n <= 4;
      const prefix = n % 2 ? '' : 'Chinese ';
      const headers = de
        ? ['Architecture', ...table[1].slice(2, -1).map((v, i) => table[0][i + 2] + ' ' + v), 'DE Score']
        : table[0].slice(1);
      if (headers.at(-1) !== table[0].at(-1) || headers.length !== (de ? 9 : 7) ||
          table[0].at(-1) !== (de ? 'DE Score' : 'DA Score')) throw new Error('Unexpected DAComp columns');
      let dedicated = de;
      for (const [model, ...values] of table.slice(de ? 2 : 1)) {
        if (model.endsWith(' Baseline')) {
          dedicated = model === 'DA-Agent Baseline';
          continue;
        }
        if (!dedicated) continue;
        const metrics = results.get(model) ?? {};
        if (values.length !== headers.length) throw new Error('Incomplete DAComp row');
        values.forEach((v, i) => {
          const cell = v.replace('\\columncolor lightgray', '').match(/^(\d+(?:\.\d+)?)(?: \(±(\d+(?:\.\d+)?)\))?$/);
          if (!cell) throw new Error('Unexpected score: ' + v);
          const key = prefix + headers[i];
          metrics[key] = Number(cell[1]);
          if (cell[2]) metrics[key + ' reported uncertainty'] = Number(cell[2]);
          board.parts![key] = key;
        });
        results.set(model, metrics);
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, metrics] of results) {
      if (!Number.isFinite(metrics['DE Score']) || !Number.isFinite(metrics['DA Score'])) continue;
      if (!Number.isFinite(metrics['Chinese DE Score']) || !Number.isFinite(metrics['Chinese DA Score'])) throw new Error('Missing localization');
      rows.push({ model, harness: 'DE-Agent and DA-Agent', metrics,
        score: (110 * metrics['DE Score'] + 100 * metrics['DA Score']) / 210 });
    }
    return checked(rows, 7);
  },
};
export default board;
