// Q-Bench's Perception A1-Single and A1-Pair tables give overall answer accuracy as fractions.
// Convert overall and category values to %. Pair is the Q-Bench+ / Q-Bench2 extension's perception
// set. Description and quality-assessment tasks are excluded, as are human reference rows.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { num } from '../html.ts';
import { markdownTables } from './github-markdown.ts';

const FEED = 'https://raw.githubusercontent.com/Q-Future/Q-Bench/master/README.md';
export function qbenchBoard(track: 'single-image-perception' | 'image-pair-perception'): Leaderboard {
  const label = track === 'single-image-perception' ? 'A1-Single' : 'A1-Pair';
  return {
    benchmark: `q-bench-${track}`, url: 'https://github.com/Q-Future/Q-Bench', feed: FEED,
    terms: 'The authors publish these official results; source repository licensing and attribution requirements apply.',
    async fetch() {
      const source = await fetchText(FEED);
      const section = source.split(`**Perception, ${label}**`)[1]?.split(/\n\*\*Perception,|\n## /)[0] ?? '';
      const t = markdownTables(section).find(t => t[0]?.[0] === 'Participant Name');
      const col = t?.[0].indexOf('overall') ?? -1;
      if (!t || col < 0) throw new Error(`Q-Bench ${label}: overall table missing`);
      const rows: LeaderboardRow[] = [];
      for (const r of t.slice(1)) {
        const score = num(r[col]);
        if (!r[0] || /human/i.test(r[0]) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 1; i < t[0].length; i++) {
          const value = num(r[i]);
          if (i !== col && value !== undefined) metrics[t[0][i]] = value * 100;
        }
        rows.push({ model: r[0], score: score * 100, metrics });
      }
      if (!rows.length) throw new Error(`Q-Bench ${label}: no accuracy rows`);
      return rows;
    },
  };
}
