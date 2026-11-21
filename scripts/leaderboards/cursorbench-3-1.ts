// CursorBench 3.1 reports agent scores on coding tasks. Read Cursor's June 29 archived table
// because Cursor replaces the live table when a new test version launches.
import type { Leaderboard } from './types.ts';
import { tables, num } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://web.archive.org/web/20260629220638id_/https://cursor.com/cursorbench";
const board: Leaderboard = {
  benchmark: 'cursorbench-3-1',
  url: "https://web.archive.org/web/20260629220638/https://cursor.com/cursorbench",
  feed,
  terms: "Cursor's robots.txt allows the leaderboard. Cursor's terms restrict automated extraction. The Internet Archive preserves this public Cursor table.",
  reference: ['Cursor'],
  aliases: { 'Kimi 2.5': 'kimi-k2-5' },
  async fetch() {
    const html = await fetchText(feed);
    if (!/<h1[^>]*>CursorBench 3\.1<\/h1>/.test(html)) throw new Error('Wrong CursorBench version');
    const table = tables(html).find(t => t[0]?.map(c => c.text).join('|') === '|Model|Score|Cost Cost / task|Tokens Tokens / task|Steps Steps / task');
    if (!table || table.length < 31) throw new Error('Missing CursorBench 3.1 results');
    return table.slice(1).map((cells, index) => {
      const [rank, label, score, cost, tokens, steps] = cells.map(c => c.text);
      const effort = label.match(/ (Extra High|Max|High|Medium|Low)$/);
      const values = [score, cost, tokens, steps].map(num);
      if (Number(rank) !== index + 1 || !label || values.some(v => v === undefined)) throw new Error('Invalid CursorBench result');
      return { model: effort ? label.slice(0, effort.index) : label, setting: effort?.[1], score: values[0]!, cost: values[1],
        tokens: values[2], metrics: { steps: values[3]! }, harness: 'Cursor' };
    });
  },
};
export default board;
