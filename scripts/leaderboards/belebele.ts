// Belebele measures reading comprehension in 122 language variants. Table 2 reports average accuracy.
// The authors give language scores for selected configurations in Appendix Tables 5 and 7.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2308.16884';
const board: Leaderboard = {
  benchmark: 'belebele', static: 'paper', url: feed + '#S3.T2', feed,
  terms: 'arXiv permits HTML retrieval with a 15-second crawl delay. The table credits Bandarkar and colleagues.',
  stats: {
    above50: { name: 'Languages at least 50% accuracy', unit: '%', better: 'higher', note: 'Proportion of the 122 languages for which the model performs at least 50% accuracy.' },
    above70: { name: 'Languages at least 70% accuracy', unit: '%', better: 'higher', note: 'Proportion of the 122 languages for which the model performs at least 70% accuracy.' },
  },
  aliases: { 'Llama 1 7B': 'llama-7b', 'Llama 1 13B': 'llama-13b', 'Llama 2 base 70B': 'llama-2-70b' },
  async fetch() {
    const html = await paperHtml(feed);
    function table(id: string) {
      return grid(paperTables(html.split('<figure id="' + id + '"')[1].split('</figure>')[0])[0]);
    }
    const main = table('S3.T2');
    if (main[0][3] !== 'AVG' || main[0][6] !== 'eng_Latn') throw new Error('Missing Belebele columns');
    let setting = '';
    const rows: LeaderboardRow[] = [];
    const parts: Record<string,string> = { eng_Latn: 'eng_Latn', nonEnglish: 'non-Eng AVG' };
    for (const cells of main.slice(1)) {
      if (new Set(cells).size === 1) { setting = cells[0]; continue; }
      const [name, size,, avg, above50, above70, english, nonEnglish] = cells;
      const model = [name.replace(/\*+$/, ''), size === 'unk' ? '' : size.split(' (')[0]].filter(Boolean).join(' ');
      const stats = [avg, above50, above70, english, nonEnglish].map(v => v?.trim() ? Number(v.replace('%','')) : NaN);
      if (!setting || !model || !stats.every(Number.isFinite)) throw new Error('Invalid Belebele result');
      rows.push({ model, setting, score: stats[0], metrics: { above50: stats[1], above70: stats[2], eng_Latn: stats[3], nonEnglish: stats[4] } });
    }
    if (rows.length < 16) throw new Error('Missing Belebele configurations');
    for (const id of ['A1.T5', 'A1.T7']) {
      const appendix = table(id);
      if (appendix[2][0] !== 'Model Name' || appendix[7][0] !== 'eng_Latn' || appendix.length < 129) throw new Error('Invalid language table');
      for (let i = 1; i < appendix[2].length; i++) {
        const name = appendix[2][i];
        const size = appendix[3][i];
        const protocol = appendix[1][i].toLowerCase().split(' ')[0];
        const target = rows.find(r => r.model.startsWith(name) && (r.setting!.toLowerCase().startsWith(protocol) ||
          (protocol === 'finetune' && r.setting === 'Full Finetuning in English')) &&
          (!size || r.model.endsWith(size)));
        // Table 2 labels this size 70B while the appendix labels it 65B.
        if (!target && name === 'Llama 1' && size === '65B') continue;
        if (!target) throw new Error('Missing headline for ' + name + ' ' + size);
        for (const cells of appendix.slice(7)) {
          const key = cells[0];
          const value = cells[i];
          if (!value || value === '-') continue;
          if (!Number.isFinite(Number(value))) throw new Error('Invalid Belebele language score: ' + value);
          parts[key] = key;
          target.metrics![key] = Number(value);
        }
      }
    }
    board.parts = parts;
    return rows;
  },
};
export default board;
