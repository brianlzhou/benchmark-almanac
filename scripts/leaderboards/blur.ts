// BLUR tests identification from incomplete clues. The authors publish overall accuracy and five query and difficulty scores in their Space's HTML table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/PatronusAI/BLUR-leaderboard/raw/main/index.html";

const board: Leaderboard = {
  benchmark: "blur",
  url: "https://huggingface.co/spaces/PatronusAI/BLUR-leaderboard",
  feed: FEED,
  terms: "The publisher provides the leaderboard files at https://huggingface.co/spaces/PatronusAI/BLUR-leaderboard Hugging Face allows all paths in robots.txt.",
  harnesses: 'system',
  parts: { qt: 'Text-only queries', qf: 'Queries with file inputs', he: 'Easy', hm: 'Medium', hh: 'Hard' },
  async fetch() {
    const table = tables(await fetchText(FEED)).find((t) => t[0]?.map((c) => c.text).join('|') === 'Model / System|Q T|Q F|H E|H M|H H|Overall');
    if (!table) throw new Error('Missing BLUR results table');
    const rows = [];
    let group = '';
    for (const cells of table.slice(1)) {
      if (cells.length === 1) { group = cells[0].text; continue; }
      if (group === 'Baselines') continue;
      const [name, ...scores] = cells.map((c) => c.text);
      const values = scores.map((s) => num(s));
      if (!name || values.length !== 6 || values.some((v) => v == null)) throw new Error('Incomplete BLUR row');
      const [qt, qf, he, hm, hh, score] = values.map((v) => v! * 100);
      const names = group === 'Agentic Systems' ? name.split(' + ') : [name];
      rows.push({ model: names.at(-1)!, harness: names.length === 2 ? names[0] : undefined, score, metrics: { qt, qf, he, hm, hh } });
    }
    if (rows.length < 12) throw new Error('Expected twelve BLUR systems');
    return rows;
  },
};
export default board;
