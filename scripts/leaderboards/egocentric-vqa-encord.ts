// Encord's Egocentric VQA benchmark tests vision-language models on 1,500 first-person visual questions.
// The score is accuracy in percent, with the publisher's 95% confidence interval retained.
// This importer reads the HTML leaderboard table in Encord's October 2026 research article.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
const URL = 'https://encord.com/data-labs/vlms-egocentric-understanding-keeping-score/';
const board: Leaderboard = {
  benchmark: 'egocentric-vqa-encord', url: URL, feed: URL,
  terms: 'Encord publishes this leaderboard in a public research article. Preserve attribution and the publisher terms.',
  async fetch() {
    const table = tables(await fetchText(URL)).find(t => t[0]?.map(c => c.text).join('|') === 'Model|Release date|Accuracy (%)|Weights');
    if (!table) throw new Error('Encord Egocentric VQA table missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const model = row[0]?.text.trim();
      const value = row[2]?.text.match(/([0-9]+(?:\.[0-9]+)?)\s*\(95% CI\s*([0-9.]+)\s*to\s*([0-9.]+)\)/);
      if (!model || !value) throw new Error('Encord leaderboard row changed');
      rows.push({ model, score: Number(value[1]), low: Number(value[2]), high: Number(value[3]) });
    }
    if (rows.length < 2) throw new Error('Encord leaderboard has too few rows');
    return rows;
  },
};
export default board;
