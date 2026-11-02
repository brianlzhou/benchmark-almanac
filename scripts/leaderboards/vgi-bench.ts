// VGI-Bench (UIUC and others, EMNLP 2026). hexuan21.github.io/VGI-Bench is a static GitHub Pages site whose
// main leaderboard table ranks video generation models (commercial and open source) by Overall score, the
// mean over the four task groups (0 to 100); that column is the score. A second table on the page scores
// image generation models on a separate image track and is not read. Group header rows ("Commercial",
// "Open Source") are skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://hexuan21.github.io/VGI-Bench/';

const board: Leaderboard = {
  benchmark: 'vgi-bench',
  url: PAGE,
  feed: `${PAGE} (static HTML, video model table, Overall)`,
  terms: 'Static GitHub Pages project page; GitHub Pages serves no robots.txt rules for it and the page states no terms.',
  aliases: {
    'Seedance 2.0': 'dreamina-seedance-2-0',
    'Gen-4.5': 'runway-gen-4-5',
    'Kling 3.0': 'kling-v3-pro',
  },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.[0]?.text === 'Model' && rows[0]?.[1]?.text === 'Overall');
    if (!t) throw new Error('video leaderboard table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const score = num(r[1]?.text);
      if (r.length > 2 && r[0]?.text && score !== undefined) rows.push({ model: r[0].text, score });
    }
    return rows;
  },
};
export default board;
