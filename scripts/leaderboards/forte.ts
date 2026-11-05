// FORTE (AGI-Eval, Meituan): 180 office tasks across 15 professions. agi-eval-official.github.io/FORTE/
// renders its table from leaderboard.json, one row per model with avg_at_3, pass_at_3 and pass_pow_3 as
// fraction strings ("0.7687"). The page sorts by Avg@3 and shows it as the primary column, so Avg@3 (0 to
// 100) is the score. Every run uses the OpenClaw harness, so that is the harness. Rows with "xxx" are not
// scored yet and are skipped. Each row also keeps the table's Pass@3 and Pass^3 columns (0 to 100) as
// metrics pass@3 ("passAt3") and pass^3 ("pass3").
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://agi-eval-official.github.io/FORTE/leaderboard.json';

interface Row {
  model: string;
  avg_at_3?: string | number;
  pass_at_3?: string | number;
  pass_pow_3?: string | number;
}

/** A fraction string ("0.7687") or percentage as 0 to 100; the page treats values of 1 or less as fractions. */
const pct = (x: string | number | undefined) => {
  const t = String(x ?? '').replace('%', '').trim();
  const v = Number(t);
  return t && Number.isFinite(v) ? (v <= 1 ? v * 100 : v) : undefined;
};

const board: Leaderboard = {
  benchmark: 'forte',
  url: 'https://agi-eval-official.github.io/FORTE/',
  feed: FEED,
  terms: 'Static JSON on the FORTE GitHub Pages site, which states no separate terms; the FORTE repository is MIT.',
  aliases: {
    'Doubao Seed 2.0 Pro': 'seed-2-0-pro',
    'HY3 Preview': 'tencent-hy3-preview',
  },
  async fetch() {
    const data = await fetchJson<Row[]>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      const score = pct(r.avg_at_3);
      if (!r.model || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const at3 = pct(r.pass_at_3);
      const pow3 = pct(r.pass_pow_3);
      if (at3 !== undefined) metrics.passAt3 = at3;
      if (pow3 !== undefined) metrics.pass3 = pow3;
      rows.push({ model: r.model.trim(), score, harness: 'OpenClaw', ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
