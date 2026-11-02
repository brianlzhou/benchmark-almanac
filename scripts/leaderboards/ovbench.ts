// OVBench (VideoChat-Online, CVPR 2025). The project page videochat-online.github.io has the leaderboard as
// one static HTML table: #, model (with its lab under the name), Size, AVG, then the per-task columns. AVG is
// the score. The name cell is joined with Size ("InternVL2" + "4B") so the resolver can place the right
// size. Rows marked with a star are online video models, a separate group on the page; they get the
// setting "online". The table is the paper's (arXiv 2501.00584, 2024-12-31), so rows carry that date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const PAGE = 'https://videochat-online.github.io/';
const PAPER_DATE = '2024-12-31';

const board: Leaderboard = {
  benchmark: 'ovbench',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (static HTML table, AVG)`,
  terms: 'Static GitHub Pages project page (no robots.txt, so nothing is disallowed); it publishes no terms.',
  aliases: {
    // InternVL2 has no 7B size; the 7B row is InternVL2-8B, whose language model is InternLM2.5-7B
    'InternVL2 7B': 'internvl2-8b',
    // the page gives MiniCPM-V 2.6 (8B) as 7B
    'MiniCPM-V 2.6 7B': 'minicpm-v-2-6',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => c.text === 'AVG') && rows[0]?.some((c) => c.text === 'Size'));
    if (!t) throw new Error('OVBench table not found');
    const head = t[0].map((c) => c.text);
    const iSize = head.indexOf('Size');
    const iAvg = head.indexOf('AVG');
    if (iSize !== 2 || iAvg !== 3) throw new Error(`unexpected columns: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const raw = text((r[1]?.html ?? '').split(/<p\b/i)[0]);
      const online = raw.includes('⭐');
      const name = raw.replace('⭐', '').trim();
      const size = r[iSize]?.text.trim() ?? '';
      const score = num(r[iAvg]?.text);
      if (!name || score === undefined) continue;
      rows.push({
        model: /^\d/.test(size) ? `${name} ${size}` : name,
        score,
        date: PAPER_DATE,
        ...(online ? { setting: 'online' } : {}),
      });
    }
    return rows;
  },
};
export default board;
