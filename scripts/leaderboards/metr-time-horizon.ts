// METR time horizons: metr.org/time-horizons/ offers its chart data as a YAML download
// (benchmark_results_1_1.yaml, Time Horizon 1.1). The headline is the 50% time horizon in minutes.
// The chart script holds the display names for the YAML's model keys.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://metr.org/time-horizons/';
const FEED = 'https://metr.org/assets/benchmark_results_1_1.yaml';
const NAMES = 'https://metr.org/assets/js/time-horizon-chart.js';

const board: Leaderboard = {
  benchmark: 'metr-time-horizon',
  url: PAGE,
  feed: FEED,
  terms: 'Linked as "Download data" on the METR page; METR states no licence, and robots.txt does not restrict /assets/.',
  aliases: {
    // METR's "GPT-3" point is davinci-002
    'GPT-3': 'davinci-002',
    'GPT-3.5': 'gpt-3-5-turbo-instruct',
    "GPT-4 Nov '23": 'gpt-4-turbo-nov-2023',
    'Claude 3.5 Sonnet (Old)': 'claude-3-5-sonnet',
    'Claude 3.5 Sonnet (New)': 'claude-3-5-sonnet-october-2024',
    'Claude Mythos Preview (early)': 'claude-mythos-preview',
  },
  async fetch() {
    const [yaml, js] = await Promise.all([fetchText(FEED), fetchText(NAMES).catch(() => '')]);
    const names = new Map<string, string>();
    for (const m of js.matchAll(/'([a-z0-9_]+)':\s*\{\s*name:\s*'((?:[^'\\]|\\.)*)'/g)) names.set(m[1], m[2].replace(/\\'/g, "'"));
    const body = yaml.slice(yaml.indexOf('\nresults:\n'));
    const rows: LeaderboardRow[] = [];
    // each result is a two-space-indented key followed by its deeper-indented block
    for (const m of body.matchAll(/^ {2}([a-z0-9_]+):\n((?:^ {4,}.*\n?)*)/gm)) {
      const [, key, block] = m;
      const p50 = block.match(/^ {6}p50_horizon_length:\n(?:^ {8}.*\n)*?^ {8}estimate:\s*([\d.eE+-]+)/m);
      if (!p50) continue;
      const scaffolds = [...block.matchAll(/^ {4}- (.+)$/gm)].map((s) => s[1].split(',').at(-1)!.trim());
      const agent = scaffolds.at(-1);
      const base = key.replace(/_inspect$/, '');
      rows.push({
        model: names.get(base) ?? names.get(key) ?? base.replace(/_/g, '-'),
        score: Number(p50[1]),
        harness: agent && agent !== 'null' ? agent : undefined,
        date: block.match(/^ {4}release_date:\s*([\d-]+)/m)?.[1],
      });
    }
    if (!rows.length) throw new Error('no results in the METR YAML');
    return rows;
  },
};
export default board;
