// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// UIT-ViCTSD tests constructive and toxic speech detection in Vietnamese comments. Table 5 reports accuracy and F1 for both tasks.
// The authors highlight F1 in their abstract and identify their proposed system as PhoBERT in Section 4.3.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = "https://arxiv.org/html/2103.10069";
const board: Leaderboard = {
  benchmark: "uit-victsd", feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: {"constructiveness": "Constructiveness", "toxicity": "Toxicity"},
  headline: "The paper reports no overall F1, so this is the plain mean of constructive and toxic speech F1.",
  async fetch() {
    const paper = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    {
      const table = flatPaperTables(paper.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid).find(t =>
        t[0]?.join('|') === "System|Constructiveness|Constructiveness|Toxicity|Toxicity");
      if (!table || table[1]?.join('|') !== '|Accuracy|F1-score|Accuracy|F1-score') throw Error('Missing reviewed results table');
      for (const cells of table.slice(2)) {
        const model = cells[0].trim();
        function value(i: number) {
          const raw = cells[i]?.replace(/%$/, '');
          if (!raw || !/^-?\d+(?:\.\d+)?$/.test(raw)) throw Error('Invalid score for ' + model);
          return Number(raw);
        }
        const metrics = { "constructivenessAccuracy": value(1), "constructiveness": value(2), "toxicityAccuracy": value(3), "toxicity": value(4) };
        rows.push({ model: model === 'Our system' ? 'PhoBERT' : model, score: (metrics.constructiveness + metrics.toxicity) / 2, metrics });
      }
    }
    return checked(rows, 8);
  },
};
export default board;
