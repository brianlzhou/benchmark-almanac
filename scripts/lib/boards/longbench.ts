// Original LongBench's headline English and Chinese tables publish Avg on a 0–100 scale.
// Read that number directly. The six task-family scores remain metrics, including the shared code
// tasks. Read only the original LongBench directory, not the repository's LongBench-v2 root.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { num } from '../html.ts';
import { markdownTables } from './github-markdown.ts';

const FEED = 'https://raw.githubusercontent.com/THUDM/LongBench/main/LongBench/README.md';
export function longbenchBoard(track: 'english' | 'chinese'): Leaderboard {
  const heading = track === 'english' ? 'English' : 'Chinese';
  return {
    benchmark: `longbench-${track}`, url: 'https://github.com/THUDM/LongBench/tree/main/LongBench', feed: FEED,
    terms: 'The authors publish these original LongBench results; retain attribution and follow the source repository terms.',
    async fetch() {
      const source = await fetchText(FEED);
      const section = source.split('#### ' + heading)[1]?.split(/\n#{1,4} /)[0] ?? '';
      const t = markdownTables(section).find(t => t[0].includes('Avg'));
      if (!t) throw new Error(`LongBench ${heading}: average table missing`);
      const col = t[0].indexOf('Avg'), rows: LeaderboardRow[] = [];
      for (const r of t.slice(1)) {
        let model = r[0]?.replace(/[*†‡]/g, '').trim();
        const score = num(r[col]);
        if (!model || score === undefined) continue;
        if (/^GPT-3\.5-Turbo-16k$/i.test(model)) model += ' (snapshot unspecified)';
        const metrics: Record<string, number> = {};
        for (let i = 1; i < t[0].length; i++) {
          const value = num(r[i]);
          if (i !== col && value !== undefined) metrics[t[0][i]] = value;
        }
        rows.push({ model, score, setting: 'zero-shot', metrics });
      }
      if (!rows.length) throw new Error(`LongBench ${heading}: no average rows`);
      return rows;
    },
  };
}
