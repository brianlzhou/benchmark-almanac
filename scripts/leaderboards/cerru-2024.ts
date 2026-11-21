// CERRU ranks Chinese essay rhetoric systems by their mean score across three tracks.
// The organizers publish the total and the available track scores in their Markdown leaderboard.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/cubenlp/CERRU/main/docs/leaderboard.md";
const board: Leaderboard = {
  benchmark: "cerru-2024",
  url: "https://github.com/cubenlp/CERRU/blob/main/docs/leaderboard.md",
  feed,
  terms: "The organizers restrict competition data to noncommercial use. They do not specify separate terms for the team scores. The raw file host has no robots.txt.",
  parts: { track1: 'Track 1', track2: 'Track 2', track3: 'Track 3' },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0]?.join('|') === '参赛队伍|Track1|Track2|Track3|🎉score');
    if (!table || table.length < 11) throw new Error('Incomplete CERRU leaderboard');
    return table.slice(1).map(([name, a, b, c, value]) => {
      const model = name.replace(/^[🥇🥈🥉]/u, '').trim();
      if (!model || [a, b, value, ...(c === '-' ? [] : [c])].some(v => !v || !Number.isFinite(Number(v)))) throw new Error('Invalid CERRU score');
      return { model, score: Number(value), metrics: { track1: Number(a), track2: Number(b), ...(c === '-' ? {} : { track3: Number(c) }) } };
    });
  },
};
export default board;
