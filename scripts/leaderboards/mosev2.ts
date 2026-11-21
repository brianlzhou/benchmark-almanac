// MOSEv2 tests video object segmentation in complex scenes. Tables IV to VII report validation J&F with a modified boundary measure.
// The tables cover mask, box and point initialization and unsupervised segmentation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2508.05630';
const board: Leaderboard = {
  benchmark: 'mosev2', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: { disappearance: 'Disappearance clips', reappearance: 'Reappearance clips' },
  async fetch() {
    const paper = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const [caption, setting] of [['TABLE IV:', 'Mask initialization'], ['TABLE V:', 'Box initialization'],
      ['TABLE VI:', 'Point initialization'], ['TABLE VII:', 'Unsupervised']]) {
      const figure = [...paper.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)].find(m => m[0].includes(caption));
      const table = figure && flatPaperTables(figure[0]).map(grid).find(t => t[0]?.includes('MOSEv2') && t[1]?.[0] === 'Method');
      if (!table) throw Error('Missing ' + caption);
      const start = table[0].indexOf('MOSEv2');
      const expected = setting === 'Point initialization' ? '1-clk' : '\\mathcal{J}\\&\\dot{\\mathcal{F}}';
      if (table[1][start] !== expected) throw Error('Missing MOSEv2 metric');
      for (const r of table.slice(2).filter(r => r.some(Boolean))) {
        const label = r[0].replace(/\s*\[\s*\d+\s*\]/g, '').trim();
        const model = label.replace(/ \(ZS\)$/, '');
        const value = (i: number) => {
          if (!/^\d+(\.\d+)?$/.test(r[i])) throw Error('Invalid score for ' + label);
          return Number(r[i]);
        };
        if (setting === 'Point initialization') {
          for (const [i, clicks] of [1, 3, 5].entries()) rows.push({ model, setting: setting + ', ' + clicks + (clicks === 1 ? ' click' : ' clicks'), score: value(start + i) });
          continue;
        }
        const mask = setting === 'Mask initialization';
        const metrics: Record<string, number> = { disappearance: value(start + (mask ? 3 : 1)), reappearance: value(start + (mask ? 4 : 2)) };
        if (mask) {
          metrics.regionSimilarity = value(start + 1);
          metrics.modifiedBoundary = value(start + 2);
          metrics.fps = value(2);
        }
        rows.push({ model, setting: setting + (model === label ? '' : ', zero-shot'), score: value(start), metrics });
      }
    }
    return checked(rows, 66);
  },
};
export default board;
