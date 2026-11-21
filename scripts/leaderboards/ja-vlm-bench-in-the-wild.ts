// JA-VLM-Bench-In-the-Wild tests Japanese answers to 50 questions about images.
// Sakana AI compares four vision-language models by overall ROUGE-L in its README.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://github.com/SakanaAI/evolutionary-model-merge';
const feed = 'https://raw.githubusercontent.com/SakanaAI/evolutionary-model-merge/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'ja-vlm-bench-in-the-wild', url, feed,
  terms: 'The repository uses Apache 2.0 at ' + url + '/blob/HEAD/LICENSE.',
  aliases: { 'LLaVA-1.6-Mistral-7B': 'llava-v1-6-mistral-7b' },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].some(c => c.startsWith('JA-VLM-Bench-In-the-Wild (ROUGE-L')));
    if (!table || table[0][0] !== 'Model') throw new Error('Missing Japanese VLM comparison');
    const idx = table[0].findIndex(c => c.startsWith('JA-VLM-Bench-In-the-Wild (ROUGE-L'));
    return checked(table.slice(1).map(row => ({ model: row[0], score: numberCell(row[idx]) })), 4);
  },
};
export default board;
