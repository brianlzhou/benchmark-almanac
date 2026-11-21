// Cohere compares multilingual chat responses against named opponents in 23 languages.
// Table 8 of the Command A paper gives each opponent-specific mean win rate and its language breakdown.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://arxiv.org/pdf/2504.00698';
const board: Leaderboard = {
  benchmark: 'm-arenahard', static: 'paper', url: 'https://arxiv.org/abs/2504.00698', feed,
  terms: 'arXiv allows PDF downloads in robots.txt. Results are credited to Cohere.',
  aliases: { 'Command A': 'cohere-command-a' },
  async fetch() {
    const pdf = await pdfText(feed);
    const end = pdf.indexOf('Table 8: Command A mArenaHard winrates');
    const start = pdf.lastIndexOf('Avg.', end);
    const [header, ...lines] = pdf.slice(start, end).trim().split('\n');
    const langs = header.trim().split(/\s+/).slice(1);
    if (start < 0 || end < 0 || langs.length !== 23 || !langs.includes('en')) throw new Error('Missing mArenaHard language columns');
    board.parts = Object.fromEntries(langs.map(key => [key, key]));
    const rows = lines.filter(l => l.trim()).map(line => {
      const match = line.trim().match(/^Command A vs\. (.+?)\s{2,}([\d.\s]+)$/);
      if (!match) throw new Error('Invalid mArenaHard opponent row');
      const [score, ...values] = match[2].trim().split(/\s+/).map(Number);
      if (values.length !== 23 || ![score, ...values].every(Number.isFinite)) throw new Error('Incomplete mArenaHard score row');
      return { model: 'Command A', setting: 'vs. ' + match[1], score, metrics: Object.fromEntries(langs.map((k, i) => [k, values[i]])) };
    });
    if (rows.length < 4) throw new Error('Expected four mArenaHard opponents');
    return rows;
  },
};
export default board;
