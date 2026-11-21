// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// SF20K-Test asks about short films. The leaderboard gives multiple-choice and open-ended accuracy per input setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ridouaneg.github.io/sf20k.html';
const board: Leaderboard = {
  benchmark: 'sf20k-test', url: feed + '#leaderboard', feed,
  headline: 'The headline averages multiple-choice and open-ended accuracy for the same input setting.',
  terms: 'Project website, CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/',
  parts: { mcqa: 'Multiple-choice question answering', oeqa: 'Open-ended question answering' },
  aliases: { 'GPT-4o-mini': 'gpt-4o-mini', 'mPLUG-Owl2 7B': 'mplug-owl2-llama2-7b', 'Long-LLaVA 7B': 'long-llava-qwen2-7b' },
  async fetch() {
    const html = (await fetchText(feed)).replace(/<!--[\s\S]*?-->/g, '');
    const table = tables(html).find(t => t[0]?.map(c => c.text).join('|') === '#|Model|#Params|MCQA|OEQA');
    if (!table || table[1].map(c => c.text).join('|') !== 'V|L|VL|V|L|VL') throw new Error('Missing SF20K columns');
    const rows: LeaderboardRow[] = [];
    for (const record of table.slice(2)) {
      const cells = record.map(c => c.text);
      if (cells.length !== 9) throw new Error('Unexpected score columns');
      const model = cells[2] === '-' ? cells[1] : cells[1] + ' ' + cells[2];
      for (const [i, setting] of ['Vision-only', 'Language-only', 'Vision-language'].entries()) {
        const values = [cells[i+3], cells[i+6]];
        if (values.includes('-')) continue;
        if (!values.every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid accuracy');
        const [mcqa, oeqa] = values.map(Number);
        rows.push({ model, setting, params: cells[2] === '-' ? undefined : parseFloat(cells[2]), score: (mcqa+oeqa)/2, metrics: { mcqa, oeqa } });
      }
    }
    return checked(rows, 33);
  },
};
export default board;
