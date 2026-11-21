// Meta-Album tests few-shot image classification. Figure 11 defines the headline as "Averages over 30 released Meta-Album datasets".
// Tables 5 to 8 and 10 to 14 give equally sized evaluations for each dataset, including individual 95% intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2302.08909';
const board: Leaderboard = {
  benchmark: 'meta-album', feed, url: feed, static: 'paper', terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'Mean accuracy across the 30 paper datasets gives each dataset equal weight, with 1,800 test tasks per dataset.',
  async fetch() {
    const paper = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, string> = {};
    for (const [number, shots] of [[5, 1], [6, 5], [7, 10], [8, 20], [10, 1], [11, 5], [12, 10], [13, 20], [14, 0]]) {
      const figure = paper.match(new RegExp('<figure\\b[^>]*\\bid="[^"]*\\.T' + number + '"[\\s\\S]*?</figure>'))?.[0];
      const t = figure && inlinePaperTables(figure).find(t => t[0]?.join('|') === 'Domain|Dataset ID|TrainFromScratch|Finetuning|MatchingNet|ProtoNet|FO-MAML');
      if (!t || t.length !== 31) throw Error('Missing Meta-Album datasets in Table ' + number);
      for (const [i, model] of t[0].slice(2).entries()) {
        const metrics: Record<string, number> = {};
        let total = 0;
        for (const row of t.slice(1)) {
          const [domain, id] = row;
          const match = row[i + 2].match(/^([\d.]+)\s*\\pm\s*([\d.]+)$/);
          if (!id || !match || id in metrics) throw Error('Invalid accuracy or interval for ' + id);
          parts[id] = id + ' (' + domain + ')';
          total += metrics[id] = Number(match[1]);
          metrics[id + ' 95% half-width'] = Number(match[2]);
        }
        const config = shots ? '5-way ' + shots + '-shot' : 'any-way any-shot';
        rows.push({ model, score: total / 30, metrics, trials: 3, setting: (number < 10 ? 'Within domain, ' : 'Cross-domain, ') + config });
      }
    }
    board.parts = parts;
    return checked(rows, 45);
  },
};
export default board;
