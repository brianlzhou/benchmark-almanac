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
    const parts: NonNullable<Leaderboard['parts']> = {};
    let open: boolean | undefined;
    for (const r of t.slice(2)) {
      if (r.length === 1) {
        open = /open source/i.test(r[0].text) ? true : r[0].text === 'Commercial' ? false : undefined;
        continue;
      }
      const score = num(r[1]?.text);
      if (!r[0]?.text || score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const [i, header] of t[1].entries()) {
        const group = t[0][2 + Math.floor(i / 4)]?.text;
        const value = num(r[i + 2]?.text);
        if (!group || value === undefined) continue;
        const average = header.text === 'Avg.';
        const key = group[0].toLowerCase() + group.slice(1).replaceAll(' ', '') + (average ? '' : header.text);
        metrics[key] = value;
        parts[key] = {name: average ? group : header.text, group: average ? 'Task group' : group};
      }
      rows.push({model: r[0].text, score, open, metrics});
    }
    board.parts = parts;
    return rows;
  },
};
export default board;
