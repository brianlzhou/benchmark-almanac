// Original tau-bench domain tables: pass^1 is the whole-domain score, converted from fractions to %.
// Pass^2 through pass^4 stay metrics. These are the legacy tasks, not tau2/tau3's revised domains.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { num } from '../html.ts';
import { markdownTables } from './github-markdown.ts';

const FEED = 'https://raw.githubusercontent.com/sierra-research/tau-bench/HEAD/README.md';
export function tauBenchBoard(track: 'retail' | 'airline'): Leaderboard {
  const domain = track === 'retail' ? 'Retail' : 'Airline';
  return {
    benchmark: `tau-bench-${track}`, url: 'https://github.com/sierra-research/tau-bench', feed: FEED,
    terms: 'The authors publish these original task results under the source repository license and host terms.',
    aliases: { 'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024', 'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet' },
    async fetch() {
      const source = await fetchText(FEED);
      const section = source.split('### ' + domain)[1]?.split(/\n###? /)[0] ?? '';
      const table = markdownTables(section)[0];
      if (table?.[0]?.[1] !== 'Pass^1') throw new Error(`tau-bench ${domain}: pass^1 table missing`);
      const rows: LeaderboardRow[] = [];
      for (const r of table.slice(1)) {
        const m = r[0].match(/^(.*?)\s*\((.*)\)$/), score = num(r[1]);
        if (!m || score === undefined) continue;
        const model = /^(gpt-4o(?:-mini)?|gemini-1\.5-(?:pro|flash))$/i.test(m[2]) ? `${m[2]} (snapshot unspecified)` : m[2];
        const metrics: Record<string, number> = {};
        for (const i of [2, 3, 4]) { const value = num(r[i]); if (value !== undefined) metrics[`pass${i}`] = value * 100; }
        rows.push({ model, harness: m[1] === 'TC' ? 'tool-calling' : m[1], score: score * 100, metrics });
      }
      if (!rows.length) throw new Error(`tau-bench ${domain}: no score rows`);
      return rows;
    },
  };
}
