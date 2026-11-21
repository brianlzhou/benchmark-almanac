// Long Range Arena compares sequence models on six long-context tasks. The
// official repository contains a fixed Markdown table, so this importer reads
// the table and keeps the published average and task scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://github.com/google-research/long-range-arena';
const FEED = 'https://raw.githubusercontent.com/google-research/long-range-arena/master/README.md';

const board: Leaderboard = {
  benchmark: 'long-range-arena', url: PAGE, feed: FEED, static: 'paper',
  terms: 'The repository is Apache-2.0 licensed and publishes this static results table.',
  parts: Object.fromEntries(['listOps', 'text', 'retrieval', 'image', 'path', 'pathX'].map((key, i) => [key, { name: ['ListOps', 'Text', 'Retrieval', 'Image', 'Path', 'Path-X'][i], group: 'Task' }])),
  async fetch() {
    const markdown = await fetchText(FEED); const rows: LeaderboardRow[] = [];
    for (const line of markdown.split('\n')) {
      const clean = line.replace(/\*\*/g, '');
      const m = clean.match(/^\s*([^|]+?)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*(FAIL|NA|[\d.]+)\s*\|\s*([\d.]+)\s*$/);
      if (!m || /^Model$/i.test(m[1].trim())) continue;
      const metrics: Record<string, number> = { listOps: Number(m[2]), text: Number(m[3]), retrieval: Number(m[4]), image: Number(m[5]), path: Number(m[6]) };
      if (!/^(FAIL|NA)$/i.test(m[7])) metrics.pathX = Number(m[7]);
      rows.push({ model: m[1].trim(), score: Number(m[8]), metrics });
    }
    if (rows.length < 10) throw new Error(`Long Range Arena: ${rows.length} rows, expected at least 10`);
    return rows;
  },
};
export default board;
