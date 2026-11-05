// WellnessBench (micro1). A static micro1 report page (see realmpathology.ts for the reader): the main
// results table gives per model the rank range, the primary pass rate (single-turn and dialogue items that
// were both safe and helpful), the single-turn and dialogue pass rates, control pass and failure rates.
// Primary pass, the table's sort order, is the score. The other rates go in `metrics` ("singleTurn",
// "dialogue", "control", "critical", "abandoned", "missedSupport", %). The page's usage table adds
// "Completion tokens per run" (`tokens`, output tokens per scenario run) and "Wall time (s)" ("time").
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Rows } from './realmpathology.ts';

const PAGE = 'https://www.micro1.ai/benchmark/wellness-bench';

const name = (s: string) => s.replace(/[\s*†‡]+$/u, '').trim();

/** Per model, the usage table's completion tokens and wall time per run. */
async function usage(): Promise<Map<string, { tokens?: number; time?: number }>> {
  const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.[0]?.text === 'Model' && rows[0].some((c) => c.text === 'Completion tokens per run'));
  const out = new Map<string, { tokens?: number; time?: number }>();
  if (!t) return out;
  const head = t[0].map((c) => c.text);
  const [iTok, iTime] = [head.indexOf('Completion tokens per run'), head.indexOf('Wall time (s)')];
  for (const r of t.slice(1)) {
    const tokens = num(r[iTok]?.text.replace(/,/g, ''));
    const time = iTime >= 0 ? num(r[iTime]?.text.replace(/,/g, '')) : undefined;
    out.set(name(r[0]?.text ?? ''), { tokens: tokens || undefined, time: time || undefined });
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'wellnessbench-micro1',
  url: PAGE,
  feed: `${PAGE} (static HTML results table, Primary pass)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  async fetch() {
    const rows = await micro1Rows(PAGE, 'Primary pass', {
      'Single turn': 'singleTurn',
      Dialogue: 'dialogue',
      'Control pass': 'control',
      'Critical failure': 'critical',
      Abandoned: 'abandoned',
      'Missed support': 'missedSupport',
    });
    const use = await usage().catch(() => new Map<string, { tokens?: number; time?: number }>());
    return rows.map((r): LeaderboardRow => {
      const u = use.get(r.model);
      if (!u) return r;
      return { ...r, tokens: u.tokens, ...(u.time ? { metrics: { ...r.metrics, time: u.time } } : {}) };
    });
  },
};
export default board;
