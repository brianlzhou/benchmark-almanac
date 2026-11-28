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
    const all = markdownTables(await fetchText(feed));
    const metaTbl = all.find(t => t[0]?.[0] === 'Model' && t[0].includes('Size') && t[0].includes('License'));
    const meta = new Map<string, { params?: number; license?: string }>();
    if (metaTbl) {
      const iSize = metaTbl[0].indexOf('Size'), iLic = metaTbl[0].indexOf('License');
      for (const r of metaTbl.slice(1)) {
        const p = r[iSize]?.match(/^(\d+(?:\.\d+)?)B$/i);
        meta.set(r[0], { params: p ? Number(p[1]) : undefined, license: r[iLic]?.trim() || undefined });
      }
    }
    const table = all.find(t => t[0].some(c => c.startsWith('JA-VLM-Bench-In-the-Wild (ROUGE-L')));
    if (!table || table[0][0] !== 'Model') throw new Error('Missing Japanese VLM comparison');
    const idx = table[0].findIndex(c => c.startsWith('JA-VLM-Bench-In-the-Wild (ROUGE-L'));
    return checked(table.slice(1).map(row => ({ model: row[0], score: numberCell(row[idx]), ...meta.get(row[0]) })), 4);
  },
};
export default board;
