// WenetSpeech's official toolkit table reports Test_Net and Test_Meeting separately.
// The paper (Table 5) calls this MER (%): Mandarin characters and English words are edit-distance
// tokens. Keep that published percentage, lower is better. Dev and AIShell-1 are excluded.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { num } from '../html.ts';
import { markdownTables } from './github-markdown.ts';

const FEED = 'https://raw.githubusercontent.com/wenet-e2e/WenetSpeech/main/README.md';
export function wenetspeechBoard(track: 'test-net' | 'test-meeting'): Leaderboard {
  const column = track === 'test-net' ? 'Test_Net' : 'Test_Meeting';
  return {
    benchmark: `wenetspeech-${track}`, url: 'https://github.com/wenet-e2e/WenetSpeech', feed: FEED,
    terms: 'The authors publish these baseline results; dataset access and reuse remain subject to their license and attribution requirements.',
    async fetch() {
      const source = (await fetchText(FEED)).replace(/\\_/g, '_');
      const t = markdownTables(source).find(t => t[0]?.[0] === 'Toolkit' && t[0].includes(column));
      if (!t) throw new Error(`WenetSpeech: ${column} table missing`);
      const col = t[0].indexOf(column), rows: LeaderboardRow[] = [];
      for (const r of t.slice(1)) {
        const score = num(r[col]);
        if (r[0] && score !== undefined) rows.push({ model: r[0], harness: r[0], score });
      }
      if (!rows.length) throw new Error(`WenetSpeech ${column}: no error-rate rows`);
      return rows;
    },
  };
}
