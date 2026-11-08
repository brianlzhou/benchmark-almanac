// VSR's two test sets have separate accuracy columns (%). The zero-shot split holds out object
// concepts; it is a dataset partition, not a prompting setting. Frozen/fine-tuned CLIP are distinct.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { num } from '../html.ts';
import { markdownTables } from './github-markdown.ts';

const FEED = 'https://raw.githubusercontent.com/cambridgeltl/visual-spatial-reasoning/master/README.md';
export function vsrBoard(track: 'random' | 'zero-shot'): Leaderboard {
  return {
    benchmark: `visual-spatial-reasoning-${track}`, url: 'https://github.com/cambridgeltl/visual-spatial-reasoning', feed: FEED,
    terms: 'The VSR source repository is Apache-2.0 licensed; retain the authors’ attribution.',
    async fetch() {
      const source = (await fetchText(FEED)).replace(/^(?!\s*\|)([^\n]*\|[^\n]*)$/gm, '|$1|');
      const t = markdownTables(source).find(t => t[0]?.[0] === 'model' && t[0].includes('random split') && t[0].includes('zero-shot'));
      if (!t) throw new Error('VSR test accuracy table missing');
      const col = t[0].indexOf(track === 'random' ? 'random split' : 'zero-shot'), rows: LeaderboardRow[] = [];
      for (const r of t.slice(1)) {
        const score = num(r[col]);
        if (r[0] && !/human/i.test(r[0]) && score !== undefined) rows.push({ model: r[0], score });
      }
      if (!rows.length) throw new Error(`VSR ${track}: no accuracy rows`);
      return rows;
    },
  };
}
