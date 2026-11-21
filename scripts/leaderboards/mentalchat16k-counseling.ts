// MentalChat16K evaluates counseling responses. Table 3 reports the average rating from GPT-4 Turbo and Gemini Pro on seven criteria.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2503.13509";
const board: Leaderboard = {
  benchmark: "mentalchat16k-counseling", static: 'paper', url: feed, feed,
  terms: 'The authors publish the paper under the license listed at https://arxiv.org/abs/2503.13509.',
  stats: { humanRank: {name:'Human rank',unit:'rating',better:'higher'} },
  parts: Object.fromEntries(Array.from({length:14}, (_,i) => ['criterion'+(i+1), 'Criterion '+(i+1)])),
  aliases: { LLaMA2: 'llama-2-7b', 'Mistral-Instruct-V0.2': 'mistral-7b-instruct-v0-2', 'Mistral-V0.1': 'mistral-7b-v0-1', 'Zephyr-Alpha': 'zephyr-7b-alpha' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0]?.[15]?.startsWith('Average Score') && t[0][16]?.startsWith('Human Rank'));
    if (!t || t[1].slice(1,15).join(' ') !== Array(7).fill('GPT Gemini').join(' ')) throw new Error('Missing Table 3 ratings');
    const rows: LeaderboardRow[] = [];
    for (const cells of t.slice(2)) {
      const label = cells[0];
      if (label.startsWith('Notes.')) break;
      const model = label.split(/\s+(?=[*{§])/)[0].replace(' -V','-V');
      const synthetic = label.includes('*'), interview = label.includes('dagger');
      const setting = synthetic && interview ? 'Fine-tuned on synthetic and interview data (16K)' : synthetic ? 'Fine-tuned on synthetic data (10K)' : interview ? 'Fine-tuned on interview data (6K)' : 'Published model';
      const metrics: Record<string, number> = {};
      for (let i=1; i<=14; i++) {
        const part = t[0][i].replace(/\s+\\uparrow$/, '') + ' (' + t[1][i] + ')';
        const key = 'criterion' + i;
        board.parts![key] = part;
        metrics[key] = numberCell(cells[i].replace(/\s*\\bullet/g, ''));
      }
      metrics.humanRank = numberCell(cells[16]);
      rows.push({model, setting, score: numberCell(cells[15]), metrics});
    }
    return checked(rows, 31);
  },
};
export default board;
