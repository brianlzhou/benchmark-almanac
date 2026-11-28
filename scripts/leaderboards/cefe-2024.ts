// CEFE evaluates Chinese essay fluency across three tracks. The organizers publish the final average and track scores in Results.md.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/cubenlp/2024CCL_CEFE/main/Results.md";
const board: Leaderboard = {
  benchmark: 'cefe-2024',
  url: "https://github.com/cubenlp/2024CCL_CEFE/blob/main/Results.md",
  feed,
  terms: "The raw file host has no robots.txt. The organizers prohibit commercial use of contest data and give no separate score reuse terms. https://github.com/cubenlp/2024CCL_CEFE",
  parts: { track1: 'Track 1', track2: 'Track 2', track3: 'Track 3' },
  async fetch() {
    const source = await fetchText(feed);
    const table = markdownTables(source.split('## Overall')[1] ?? '')[0];
    if (table?.[0].join('|') !== 'Rank|Team Name|Track1|Track2|Track3|Overall|System report' || table.length < 11)
      throw new Error('Missing final CEFE standings');
    return table.slice(1).map(([, model, t1, t2, t3, overall]) => {
      if (!model || !/^\d+(?:\.\d+)?$/.test(overall)) throw new Error('Invalid overall score');
      const metrics: Record<string, number> = {};
      for (const [i, value] of [t1, t2, t3].entries()) {
        if (!/^\d+(?:\.\d+)?(?:\(b\))?$/.test(value)) throw new Error('Invalid track score');
        // The organizers substitute a baseline in the average when a team skips a track.
        if (!value.endsWith('(b)')) metrics['track' + (i + 1)] = Number(value);
      }
      return { model, submitter: model, score: Number(overall), metrics };
    });
  },
};
export default board;
