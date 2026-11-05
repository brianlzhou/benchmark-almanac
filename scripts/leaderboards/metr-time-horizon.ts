// METR Time Horizon 1.0 (170 tasks, run in Vivaria). metr.org/time-horizons/ offers its chart data as YAML
// downloads, one per suite version: benchmark_results_1_0.yaml for 1.0 and benchmark_results_1_1.yaml for
// 1.1 (metr-time-horizon-1-1.ts, which reuses metrRows). The headline is the 50% time horizon in minutes.
// The chart script holds the display names for the YAML's model keys.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://metr.org/time-horizons/';
export const metrFeed = (version: '1_0' | '1_1') => `https://metr.org/assets/benchmark_results_${version}.yaml`;
const FEED = metrFeed('1_0');
const NAMES = 'https://metr.org/assets/js/time-horizon-chart.js';

export const METR_TERMS =
  'Linked as "Download data" on the METR page; METR states no license, and robots.txt does not restrict /assets/.';

export const METR_ALIASES: Record<string, string> = {
  // METR's paper used the 1.5B GPT-2
  'GPT-2': 'gpt-2-1-5b',
  // METR's "GPT-3" point is davinci-002
  'GPT-3': 'davinci-002',
  'GPT-3.5': 'gpt-3-5-turbo-instruct',
  "GPT-4 Nov '23": 'gpt-4-turbo-nov-2023',
  'Claude 3.5 Sonnet (Old)': 'claude-3-5-sonnet',
  'Claude 3.5 Sonnet (New)': 'claude-3-5-sonnet-october-2024',
  'Claude Mythos Preview (early)': 'claude-mythos-preview',
  'Kimi K2 Thinking (inference via Novita AI)': 'kimi-k2-thinking',
};

/**
 * One row per model in a METR benchmark_results YAML: the p50 horizon (minutes), scaffold and release date,
 * with the p50 horizon's 95% interval (metrics.ciLow, ciHigh) and the p80 horizon (metrics.p80, minutes).
 */
export async function metrRows(feed: string): Promise<LeaderboardRow[]> {
  const [yaml, js] = await Promise.all([fetchText(feed), fetchText(NAMES).catch(() => '')]);
  const names = new Map<string, string>();
  for (const m of js.matchAll(/'([a-z0-9_]+)':\s*\{\s*name:\s*'((?:[^'\\]|\\.)*)'/g))
    names.set(m[1], m[2].replace(/\\'/g, "'"));
  const body = yaml.slice(yaml.indexOf('\nresults:\n'));
  const rows: LeaderboardRow[] = [];
  // each result is a two-space-indented key followed by its deeper-indented block
  for (const m of body.matchAll(/^ {2}([a-z0-9_]+):\n((?:^ {4,}.*\n?)*)/gm)) {
    const [, key, block] = m;
    const p50 = block.match(/^ {6}p50_horizon_length:\n(?:^ {8}.*\n)*?^ {8}estimate:\s*([\d.eE+-]+)/m);
    if (!p50) continue;
    // one number under one of the metrics, such as p50_horizon_length's ci_low
    const field = (metric: string, name: string) => {
      const v = block.match(new RegExp(`^ {6}${metric}:\\n(?:^ {8}.*\\n)*?^ {8}${name}:\\s*([\\d.eE+-]+)`, 'm'))?.[1];
      return v === undefined || !Number.isFinite(Number(v)) ? undefined : Number(v);
    };
    const [ciLow, ciHigh, p80] = [field('p50_horizon_length', 'ci_low'), field('p50_horizon_length', 'ci_high'), field('p80_horizon_length', 'estimate')];
    const metrics = { ...(ciLow !== undefined && ciHigh !== undefined ? { ciLow, ciHigh } : {}), ...(p80 !== undefined ? { p80 } : {}) };
    const scaffolds = [...block.matchAll(/^ {4}- (.+)$/gm)].map((s) => s[1].split(',').at(-1)!.trim());
    const agent = scaffolds.at(-1);
    const base = key.replace(/_inspect$/, '');
    rows.push({
      model: names.get(base) ?? names.get(key) ?? base.replace(/_/g, '-'),
      score: Number(p50[1]),
      harness: agent && agent !== 'null' ? agent : undefined,
      date: block.match(/^ {4}release_date:\s*([\d-]+)/m)?.[1],
      ...(Object.keys(metrics).length ? { metrics } : {}),
    });
  }
  if (!rows.length) throw new Error('no results in the METR YAML');
  return rows;
}

const board: Leaderboard = {
  benchmark: 'metr-time-horizon',
  url: PAGE,
  feed: FEED,
  terms: METR_TERMS,
  aliases: METR_ALIASES,
  fetch: () => metrRows(FEED),
};
export default board;
