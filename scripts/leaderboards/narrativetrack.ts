// NarrativeTrack tests entity tracking across clips. Table 2 gives overall accuracy and scores by task and question format.
// Tables 4 and 5 add input ablations and likelihood-based evaluation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const feed = 'https://arxiv.org/html/2601.01095v2';
const formats: Record<string, string> = { B: 'Binary', MC: 'Multiple choice', O: 'Ordering' };
const tasks = ['Existence', 'Action Changes', 'Outfit Changes', 'Scene Changes', 'Ambiguity'];
const board: Leaderboard = {
  benchmark: 'narrativetrack', static: 'paper', url: feed, feed,
  terms: 'Apple publishes the paper under the terms listed at https://arxiv.org/abs/2601.01095.',
  aliases: { 'Qwen-2.5-VL-7B': 'qwen2-5-vl-7b', 'Qwen-2.5-VL-32B': 'qwen2-5-vl-32b', 'InterVL3-8B': 'internvl3-8b',
    'VILA-8B': 'llama-3-vila1-5-8b', 'LLaVA-Video-7B': 'llava-video-7b-qwen2' },
  async fetch() {
    const figures = (await paperHtml(feed)).match(/<figure\b[^>]*>[\s\S]*?<\/figure>/g) ?? [];
    const parts: Record<string, string> = {}, rows: LeaderboardRow[] = [];
    for (const id of ['S4.T2', 'S9.T4', 'S9.T5']) {
      const figure = figures.find(f => f.startsWith('<figure id="' + id + '"'));
      const table = figure && inlinePaperTables(figure)[0];
      if (!table || table[0][0] !== 'Model' || table[0].at(-1) !== 'Avg.') throw new Error('Missing NarrativeTrack table ' + id);
      const likelihood = id === 'S9.T5';
      if (likelihood && table[0].slice(1, -1).join(' ') !== 'EE AC OC SC EA') throw new Error('Likelihood tasks changed');
      const keys = likelihood ? tasks : table[0].slice(1, -1).map((label, i) => {
        const task = label.split(' (')[0], format = formats[table[1][i + 1]];
        if (!tasks.includes(task) || !format) throw new Error('Unknown question format');
        return task + ': ' + format;
      });
      keys.forEach(key => { parts[key] = key; });
      for (const row of table.slice(likelihood ? 1 : 2)) {
        const name = row[0].replace(/\s*\[\s*\d+\s*\]/g, '');
        if (name.endsWith('MLLMs') || name === 'Random' || (id === 'S9.T4' && name === 'GPT-4o')) continue;
        const gpt = name.match(/^GPT-4o (.+)$/);
        rows.push({ model: gpt ? 'GPT-4o' : name, setting: likelihood ? 'Likelihood-based evaluation' : gpt?.[1].replace(/[()]/g, ''),
          score: numberCell(row.at(-1)!), metrics: Object.fromEntries(keys.map((key, i) => [key, numberCell(row[i + 1])])) });
      }
    }
    board.parts = parts;
    return checked(rows, 19);
  },
};
export default board;
