// Micro1 ranks personal assistants by task completion. The report's provisional standings also give trusted completion.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://www.micro1.ai/personal-agent-bench";

const board: Leaderboard = {
  benchmark: "personal-agent-bench-micro1",
  url: "https://www.micro1.ai/personal-agent-bench",
  feed,
  terms: "The public report gives no reuse license for scores. The site robots.txt lists its sitemap.",
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Standing|Assistant|Task completion|Trusted completion');
    if (!table || table.length < 7) throw new Error('Missing assistant standings');
    return table.slice(1).map(c => {
      const score = num(c[2]?.text), trusted = num(c[3]?.text);
      if (!c[1]?.text || score === undefined || trusted === undefined) throw new Error('Incomplete assistant scores');
      return { model: c[1].text, score, metrics: { trustedCompletion: trusted } };
    });
  },
};

export default board;
