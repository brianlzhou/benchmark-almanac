// VitaBench 2.0 on vitabench2.github.io. The leaderboard is static HTML in two tables, thinking models and
// non-thinking models, each with a two-row header: # | Model | Full Context | Agentic Memory | RAG Memory,
// then Avg@4 | Pass@4 | Pass^4 under each memory setting. The page sorts by Avg@4 with full context (a
// fraction, shown here as 0 to 100), which is the score. The table a row comes from becomes the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://vitabench2.github.io/';

const board: Leaderboard = {
  benchmark: 'vitabench-2',
  url: URL,
  feed: `${URL} (thinking and non-thinking tables, Full Context Avg@4)`,
  terms: 'Static GitHub Pages project page with no robots.txt and no terms; the scores are cited to the VitaBench authors.',
  aliases: {},
  async fetch() {
    const boards = tables(await fetchText(URL)).filter((t) => t[0]?.[2]?.text === 'Full Context' && /^Avg@4$/.test(t[1]?.[0]?.text ?? ''));
    if (boards.length !== 2) throw new Error(`expected two VitaBench 2.0 tables, found ${boards.length}`);
    const rows: LeaderboardRow[] = [];
    boards.forEach((t, k) => {
      for (const r of t.slice(2)) {
        const score = num(r[2]?.text);
        if (!r[1]?.text || score === undefined) continue;
        rows.push({ model: r[1].text, score: score * 100, setting: k === 0 ? 'thinking' : 'non-thinking' });
      }
    });
    if (!rows.length) throw new Error('no rows in the VitaBench 2.0 tables');
    return rows;
  },
};
export default board;
