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
  parts: {
    fpAa: { name: 'AA', group: 'FP' },
    fpGsp: { name: 'GSP', group: 'FP' },
    fpMp: { name: 'MP', group: 'FP' },
    thvAp: { name: 'AP', group: 'THV' },
    thvSv: { name: 'SV', group: 'THV' },
    thvOp: { name: 'OP', group: 'THV' },
    pmAr: { name: 'AR', group: 'PM' },
    pmPr: { name: 'PR', group: 'PM' },
    pmTr: { name: 'TR', group: 'PM' },
    spAl: { name: 'AL', group: 'SP' },
    spOp: { name: 'OP', group: 'SP' },
    stpAt: { name: 'AT', group: 'STP' },
    stpOt: { name: 'OT', group: 'STP' },
    tpAs: { name: 'AS', group: 'TP' },
    tpSl: { name: 'SL', group: 'TP' },
    tpOes: { name: 'OES', group: 'TP' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => c.text === 'AVG') && rows[0]?.some((c) => c.text === 'Size'));
    if (!t) throw new Error('OVBench table not found');
    const head = t[0].map((c) => c.text);
    const iSize = head.indexOf('Size');
    const iAvg = head.indexOf('AVG');
    if (iSize !== 2 || iAvg !== 3) throw new Error(`unexpected columns: ${head.join(' | ')}`);
    const subKeys = [
      'fpAa', 'fpGsp', 'fpMp', 'thvAp', 'thvSv', 'thvOp',
      'pmAr', 'pmPr', 'pmTr', 'spAl', 'spOp', 'stpAt', 'stpOt',
      'tpAs', 'tpSl', 'tpOes',
    ] as const;
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const raw = text((r[1]?.html ?? '').split(/<p\b/i)[0]);
      const online = raw.includes('⭐');
      const name = raw.replace('⭐', '').trim();
      const size = r[iSize]?.text.trim() ?? '';
      const score = num(r[iAvg]?.text);
      if (!name || score === undefined) continue;
      const sz = size.match(/^(\d+(?:\.\d+)?)B$/i);
      const link = r[1]?.html.match(/href="(https?:\/\/[^"]+)"/i)?.[1];
      const metrics: Record<string, number> = {};
      for (const [idx, key] of subKeys.entries()) {
        const v = num(r[iAvg + 1 + idx]?.text);
        if (v !== undefined) metrics[key] = v;
      }
      rows.push({
        model: /^\d/.test(size) ? `${name} ${size}` : name,
        score,
        date: PAPER_DATE,
        ...(sz ? { params: Number(sz[1]) } : {}),
        ...(link ? { link } : {}),
        ...(online ? { setting: 'online' } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
