// doteBench evaluates speech edits. Its README ranks systems by operation success across all cases and also reports all-success and preservation measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://raw.githubusercontent.com/studio-dots-ai/doteBench/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "dotebench",
  url: "https://github.com/studio-dots-ai/doteBench#reference-results",
  feed,
  terms: "The authors apply Apache 2.0 to their documentation and visuals. Source recordings and transcripts retain their own terms. https://github.com/studio-dots-ai/doteBench#license-and-citation The feed host returns no robots.txt.",
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[0]?.text === 'Candidate');
    const expected = ['Operation success', 'All success', 'SIM', 'WDTW-Dur', 'WDTW-F0'];
    if (!table || table.length < 8 || !expected.every((s, i) => table[1][i]?.text.startsWith(s))) throw new Error('Incomplete reference results');
    return table.slice(2).map(cells => {
      const [model, ...values] = cells.map(c => c.text);
      const [score, allSuccess, sim, duration, pitch] = values.map(Number.parseFloat);
      if (!model || ![score, allSuccess, sim, duration, pitch].every(Number.isFinite)) throw new Error('Invalid speech editing score');
      return { model, score, metrics: { allSuccess, sim, duration, pitch } };
    });
  },
};
export default board;
