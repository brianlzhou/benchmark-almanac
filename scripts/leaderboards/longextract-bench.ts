// LongExtract-Bench (Reducto x micro1). The board ranks extraction products and three frontier models called directly.
// A static micro1 report page (see realmpathology.ts, micro1Data): the page's leaderboard card is an inline data
// literal, window.benchmarks_data["long-extraction"], read as data. Its default tab, Recall (0 to 100), is the score.
// Companion HTML tables on the same page supply Precision, Leaf accuracy, Completed count, Failures, Failure rate, and
// runtime latency percentiles (mean, p50, p90, p95).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Data } from './realmpathology.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://www.micro1.ai/benchmark/long-extraction';

const TABLE_NAMES: Record<string, string> = {
  Extend: 'Extend MAX',
  'Extend Max': 'Extend MAX',
  LlamaExtract: 'LlamaExtract - Agentic',
};

const board: Leaderboard = {
  benchmark: 'longextract-bench',
  stats: {
    completed: { name: 'Completed documents', unit: 'count', better: 'higher' },
    precision: { name: 'Precision', unit: '%', better: 'higher' },
    leafAcc: { name: 'Leaf accuracy', unit: '%', better: 'higher' },
    failures: { name: 'Failures', unit: 'count', better: 'lower' },
    failureRate: { name: 'Failure rate', unit: '%', better: 'lower' },
    latencyMean: { name: 'Mean runtime', unit: 'seconds', better: 'lower' },
    latencyP50: { name: 'Median runtime (p50)', unit: 'seconds', better: 'lower' },
    latencyP90: { name: 'p90 runtime', unit: 'seconds', better: 'lower' },
    latencyP95: { name: 'p95 runtime', unit: 'seconds', better: 'lower' },
  },
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "long-extraction", Recall, and static HTML results tables)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  async fetch(): Promise<LeaderboardRow[]> {
    const [rows, html] = await Promise.all([micro1Data(PAGE, 'long-extraction'), fetchText(PAGE)]);
    const all = tables(html);
    const byModel = new Map<string, Record<string, number>>();
    const put = (name: string, key: string, raw: string | undefined) => {
      const v = num(raw);
      if (v === undefined) return;
      const canon = TABLE_NAMES[name] ?? name;
      (byModel.get(canon) ?? (byModel.set(canon, {}), byModel.get(canon)!))[key] = v;
    };
    const main = all.find((t) => t[0]?.[0]?.text === 'System' && t[0].some((c) => c.text.includes('Completed')));
    if (main) {
      for (const r of main.slice(1)) {
        const name = r[0]?.text.trim();
        if (!name) continue;
        put(name, 'completed', r[1]?.text);
        put(name, 'precision', r[2]?.text);
        put(name, 'leafAcc', r[4]?.text);
      }
    }
    const fail = all.find((t) => t[0]?.[0]?.text === 'System' && t[0]?.[1]?.text === 'Failures');
    if (fail) {
      for (const r of fail.slice(1)) {
        const name = r[0]?.text.trim();
        if (!name) continue;
        put(name, 'failures', r[1]?.text);
        put(name, 'failureRate', r[2]?.text);
      }
    }
    const lat = all.find((t) => t[0]?.[0]?.text === 'System' && t[0].some((c) => c.text === 'p50'));
    if (lat) {
      for (const r of lat.slice(1)) {
        const name = r[0]?.text.trim();
        if (!name) continue;
        put(name, 'latencyMean', r[3]?.text);
        put(name, 'latencyP50', r[4]?.text);
        put(name, 'latencyP90', r[5]?.text);
        put(name, 'latencyP95', r[6]?.text);
      }
    }
    return rows.map((row) => {
      const m = byModel.get(row.model);
      return m && Object.keys(m).length ? { ...row, metrics: m } : row;
    });
  },
};
export default board;
