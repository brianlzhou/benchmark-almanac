// Agents sell insurance to simulated buyers. The score is composite reward over a sales episode.
// Tables 1 and 4 compare policies at two lead counts. The authors exclude GPT-5.5 because its harness changed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/Hamza-Mos/salesbench-prime/main/paper/salesbench_wab.pdf';
const board: Leaderboard = {
  benchmark: 'salesbench-insurance', static: 'paper', url: 'https://hamzamostafa.com/blog/salesbench', feed,
  terms: 'The authors share the paper at https://github.com/Hamza-Mos/salesbench-prime/tree/main/paper.',
  headline: 'Each external model ran one episode per lead count. The trained and untrained Qwen policies ran 64.',
  aliases: { 'Opus 4.7': 'claude-opus-4-7' },
  stats: { stderr: { name: 'Reward standard error', unit: 'score' }, conversion: { name: 'Conversion per lead', unit: '%' },
    conversionSE: { name: 'Conversion standard error', unit: '%' }, mrr: { name: 'Monthly recurring revenue capture', unit: '%' }, done: { name: 'Episodes completed', unit: '%' } },
  async fetch() {
    const paper = (await pdfText(feed)).replaceAll('−', '-');
    const matrix = paper.match(/Scale\s+Agent \/ buyer\s+reward\s+conv\/lead\s+mrr-cap\s+done([\s\S]*?)Table 1:/)?.[1];
    const external = paper.match(/Model\s+50-lead reward\s+100-lead reward([\s\S]*?)Table 4:/)?.[1];
    if (!matrix || !external) throw new Error('Missing SalesBench score tables');
    const rows: LeaderboardRow[] = [];
    const blocks = matrix.trim().split(/(?=untrained,)/).filter(s => s.trim());
    for (const block of blocks) {
      const leads = block.match(/(\d+) leads/)?.[1];
      if (!leads) throw new Error('Missing lead count');
      const matches = [...block.matchAll(/(untrained|trained),\s*([A-Z ]+?)\s+(-?[\d.]+)\s+±([\d.]+)\s+([\d.]+)\s+±([\d.]+)\s+([\d.]+)\s+([\d.]+)/g)];
      if (matches.length !== 5) throw new Error('Incomplete buyer matrix');
      for (const [, policy, buyer, score, se, conv, convSE, mrr, done] of matches) {
        rows.push({ model: policy === 'trained' ? 'Trained Qwen3.5-2B' : 'Qwen3.5-2B',
          setting: leads + ' leads, ' + buyer.replaceAll(' ', '').toLowerCase() + ' buyer', trials: 64, score: Number(score),
          metrics: { stderr: Number(se), conversion: 100 * Number(conv), conversionSE: 100 * Number(convSE), mrr: 100 * Number(mrr), done: 100 * Number(done) } });
      }
    }
    for (const line of external.trim().split('\n')) {
      const match = line.trim().match(/^(.+?)\s{2,}([\d.]+)\s+([\d.]+)$/);
      if (!match) throw new Error('Invalid external model row');
      if (match[1].startsWith('Trained Qwen')) continue;
      for (const [i, leads] of [50, 100].entries()) rows.push({ model: match[1], setting: leads + ' leads, default buyer', harness: 'OpenRouter', score: Number(match[i + 2]), trials: 1 });
    }
    return checked(rows, 20);
  },
};
export default board;
