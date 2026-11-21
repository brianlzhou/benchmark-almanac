// ScribbleEdit tests image editing from scribble instructions across five operations.
// Table 2 reports average intention accuracy, focused SSIM and focused CLIP similarity for nine systems.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2610.09382';
const board: Leaderboard = {
  benchmark: 'scribbleedit', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2610.09382',
  headline: 'The paper reports no overall score, so this is average intention accuracy, the first metric in Table 2.',
  parts: { intentionAccuracy: 'Intention Accuracy', focusedSSIM: 'Focused SSIM', focusedCLIP: 'Focused CLIP-sim' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[1] === 'Operation' && t[1]?.[0] === 'Intention Accuracy');
    if (!table) throw new Error('ScribbleEdit results table missing');
    const avg = table.find(row => row[1] === 'Average'); if (!avg) throw new Error('ScribbleEdit averages missing');
    const names = table[0].slice(2); const intention = avg.slice(2).map(Number);
    const ssim = table.findIndex(row => row[0] === 'Focused SSIM'); const clip = table.findIndex(row => row[0] === 'Focused CLIP-sim');
    const ssimAvg = table[ssim + 5].slice(2).map(Number); const clipAvg = table[clip + 5].slice(2).map(Number);
    const rows: LeaderboardRow[] = names.map((model, i) => ({ model, score: intention[i], metrics: { intentionAccuracy: intention[i], focusedSSIM: ssimAvg[i], focusedCLIP: clipAvg[i] } }));
    return checked(rows, 9);
  },
};
export default board;
