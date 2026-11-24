// CursorBench 3.2 reports agent scores on ambiguous, multi-file coding tasks from real Cursor sessions.
// Cursor replaces the live page when a new version launches, so this importer reads the last Internet Archive
// snapshot of CursorBench 3.2 (2026-09-09, one day before 4.0 launched). Score is task success in percent,
// cost is US dollars per task, tokens is output tokens per task, and steps is agent steps per task.
import type { Leaderboard } from './types.ts';
import { num, tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const SNAPSHOT = '20260909171121';
const URL = `https://web.archive.org/web/${SNAPSHOT}/https://cursor.com/cursorbench`;
const FEED = `https://web.archive.org/web/${SNAPSHOT}id_/https://cursor.com/cursorbench`;

const board: Leaderboard = {
  benchmark: 'cursorbench-3-2',
  url: URL,
  feed: FEED,
  terms: "Cursor's robots.txt allows the leaderboard. Cursor's terms restrict automated extraction. The Internet Archive preserves this public Cursor table and chart, and Benchmark Almanac credits and links Cursor as the source.",
  reference: ['Cursor'],
  stats: { steps: { name: 'Steps per task', unit: 'count', better: 'lower' } },
  chart: {
    title: 'CursorBench 3.2 score by average cost per task',
    x: { key: 'cost', label: 'Average cost per task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'CursorBench 3.2 score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(FEED);
    if (!/<h1[^>]*>CursorBench 3\.2<\/h1>/.test(html)) throw new Error('Archived CursorBench page is not 3.2');
    const table = tables(html).find((t) => t[0]?.map((c) => c.text).join('|') === '|Model|Score|Cost Cost / task|Tokens Tokens / task|Steps Steps / task');
    if (!table || table.length < 67) throw new Error(`Missing CursorBench 3.2 results: found ${table?.length ?? 0} rows`);
    return table.slice(1).map((cells, index) => {
      const [rank, label, score, cost, tokens, steps] = cells.map((c) => c.text);
      const effort = label.match(/ (Extra High|Max|High|Medium|Low)$/);
      const values = [score, cost, tokens, steps].map(num);
      if (Number(rank) !== index + 1 || !label || values.some((v) => v === undefined)) throw new Error(`Invalid CursorBench 3.2 row: ${label}`);
      return {
        model: effort ? label.slice(0, effort.index) : label,
        setting: effort?.[1],
        score: values[0]!,
        cost: values[1],
        tokens: values[2],
        metrics: { steps: values[3]! },
        harness: 'Cursor',
      };
    });
  },
};
export default board;
