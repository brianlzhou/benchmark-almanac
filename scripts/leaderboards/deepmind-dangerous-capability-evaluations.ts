// DeepMind evaluated several distinct agent capabilities. The paper gives no overall score.
// Figure 4 measures the first task listed in Table 1, Money Talks. Read its vector bars
// and confidence limits as the percentage of a £20 bonus donated after a conversation.
// Table 9 adds defensive patch and function classification results for Pro and Ultra.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { createHash } from 'node:crypto';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const paper = 'https://arxiv.org/html/2403.13793';
const feed = 'https://arxiv.org/html/2403.13793v2/donation.svg';
const board: Leaderboard = {
  benchmark: 'deepmind-dangerous-capability-evaluations', url: paper, feed, static: 'paper',
  terms: 'The authors publish the figure and tables under the terms on the paper record. https://arxiv.org/abs/2403.13793',
  headline: 'The paper gives no overall score. Money Talks measures the percentage of a £20 bonus participants donated.',
  aliases: {'Pro 1.0':'gemini-1-0-pro', 'Ultra 1.0':'gemini-1-0-ultra'},
  async fetch() {
    const svg = await paperHtml(feed);
    if (createHash('sha256').update(svg).digest('hex') !== '6b246ce0a3511f8bd4c343981e6edced228c73b09cbab70d6c9ee52cd8da2363') throw new Error('Money Talks chart changed');
    const plot = svg.split('</defs>')[1];
    const bars = [...plot.matchAll(/d="M[\d.]+ 35\.06875H[\d.]+V([\d.]+)H[\d.]+Z" fill="#(?:eeeeee|b8cdf1|588bde|2d5ea8)"/g)];
    const limits = [...plot.matchAll(/stroke="#424242" d="M[\d.]+ ([\d.]+)V([\d.]+)"/g)];
    if (bars.length !== 4 || limits.length !== 4) throw new Error('Missing bar or confidence limit');
    // Grid lines at £0 and £5 calibrate the ordinate. Skip the first bar, the no-chatbot baseline.
    const percent = (y: string) => Number(((Number(y) - 35.06875) * 25 / (139.61147 - 35.06875)).toFixed(2));
    const rows: LeaderboardRow[] = ['Nano 1.0', 'Pro 1.0', 'Ultra 1.0'].map((model,i) => ({
      model, score: percent(bars[i+1][1]), low: percent(limits[i+1][1]), high: percent(limits[i+1][2]), metrics: {},
    }));
    const tables = flatPaperTables(await paperHtml(paper)).map(grid);
    const detection = tables.find(t => t[0]?.join('|') === 'Task|Model|Acc. (%)|Prec. (%)|Recall (%)|F1 (%)|AUC');
    if (!detection || detection.length !== 7) throw new Error('Missing defensive classification results');
    board.parts = {};
    for (const [task, model, ...cells] of detection.slice(1)) {
      const row = rows.find(r => r.model === model);
      if (!row || cells.length !== 5) throw new Error('Unknown defensive classification row');
      cells.forEach((cell,i) => {
        const [value, std] = cell.split(' \\pm ').map(numberCell);
        if (std === undefined) throw new Error('Missing standard deviation');
        const metric = ['Accuracy','Precision','Recall','F1','AUC'][i];
        const key = task + ': ' + metric;
        row.metrics![key] = value;
        row.metrics![key + ' std'] = std;
        board.parts![key] = {name: key, unit: i === 4 ? 'score' : '%'};
      });
    }
    return checked(rows, 3);
  },
};
export default board;
