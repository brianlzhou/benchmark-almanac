// CAISI measures accuracy on 2024 Princeton mathematics competition problems.
// Its results table lists one percentage and reasoning level for each model.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.nist.gov/news-events/news/2026/05/caisi-evaluation-deepseek-v4-pro';
const board: Leaderboard = {
  benchmark: 'pumac-2024', host: 'CAISI', url: feed, feed,
  terms: 'NIST publishes these evaluation results at https://www.nist.gov/disclaimer.',
  aliases: { 'OpenAI GPT-5.5': 'gpt-5-5', 'OpenAI GPT-5.4 mini': 'gpt-5-4-mini', 'Anthropic Opus 4.6': 'claude-opus-4-6' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.some(c => c.text === 'Model (reasoning level)') && t.some(r => r.some(c => c.text === 'PUMaC 2024')));
    if (!table) throw new Error('Missing PUMaC 2024 comparison table');
    const scores = table.find(r => r[0]?.text === 'PUMaC 2024')?.slice(1);
    const models = table[1];
    if (!scores || scores.length !== models.length) throw new Error('Model and score columns differ');
    return checked(models.map((cell, i) => {
      const match = cell.text.match(/^(.+) \(([^)]+)\)$/);
      if (!match || !/^\d+(?:\.\d+)?%$/.test(scores[i].text)) throw new Error('Unexpected model or accuracy');
      return { model: match[1], setting: match[2], score: parseFloat(scores[i].text) };
    }), 4);
  },
};
export default board;
