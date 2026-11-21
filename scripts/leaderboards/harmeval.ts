// HarmEval measures the percentage of unsafe responses to a fixed set of requests.
// Tables 1 and 2 give the overall rate for a simple prompt. Tables 20 and 21 break it down by topic.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.12274';
const board: Leaderboard = {
  benchmark: 'harmeval', url: feed, feed, static: 'paper',
  terms: 'The authors publish the tables under the terms linked at https://arxiv.org/abs/2406.12274.',
  aliases: { 'Mistral': 'mistral-7b-instruct-v0-2' },
  async fetch() {
    const html = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    const tables = [...html.matchAll(/<figure\b[^>]*class="[^"]*ltx_table[^"]*"[^>]*>([\s\S]*?)<\/figure>/g)];
    for (const model of ['Llama-2', 'Mistral']) {
      const getTable = (pattern: string) => {
        const block = tables.find(f => f[1].split('<figcaption').at(-1)?.includes(pattern));
        if (!block) throw new Error('Missing HarmEval table for ' + model);
        return flatPaperTables(block[1]).map(grid)[0];
      };
      const scores = getTable(model + ' model across all datasets for the simple prompt setting');
      const topicTable = tables.map(f => f[1]).find(f => f.includes('HarmEval (% unethical)') && f.split('<figcaption').at(-1)?.includes('Base model: ' + model + ', Prompt: simple.'));
      if (!topicTable || scores[0].at(-1) !== 'HarmEval') throw new Error('Missing HarmEval columns');
      const topicRows = flatPaperTables(topicTable).map(grid)[0];
      if (topicRows[0].join('|') !== 'HarmEval (% unethical)|Base model|SafeInfer' || topicRows.at(-1)?.[0] !== 'Average') throw new Error('Unexpected topic columns');
      const topics = topicRows.slice(1, -1);
      board.parts = Object.fromEntries(topics.map(([name]) => [name, name]));
      for (const r of scores.slice(1)) {
        const value = r.at(-1)!;
        if (value === '-') continue;
        const method = r[0];
        const col = topicRows[0].indexOf(method);
        const metrics = col > 0 ? Object.fromEntries(topics.map(t => [t[0], numberCell(t[col])])) : undefined;
        rows.push({ model, setting: 'Simple prompt, ' + method, score: numberCell(value), metrics });
      }
    }
    return checked(rows, 11);
  },
};
export default board;
