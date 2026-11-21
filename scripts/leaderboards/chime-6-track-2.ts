// CHiME-6 Track 2 scores unsegmented speech recognition by evaluation-set word error rate.
// The organizers publish constrained and unconstrained language model results in separate tables.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://chimechallenge.github.io/chime6/results.html";

const board: Leaderboard = {
  benchmark: "chime-6-track-2",
  url: "https://chimechallenge.github.io/chime6/results.html",
  feed,
  terms: "CHiME requires a license for the recordings. The public results page gives no separate score reuse terms. https://chimechallenge.github.io/chime6/results.html The site returns 404 for robots.txt.",
  parts: { dev: 'Dev' },
  async fetch() {
    const html = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    for (const [ranking, minimum] of [['A (constrained LM)', 9], ['B (unconstrained LM)', 6]] as const) {
      const section = html.split('<h2>Track 2, Ranking ' + ranking + '</h2>')[1];
      const table = section && tables(section)[0];
      if (!table || table.length <= minimum || table[0].map(c => c.text).join('|') !== 'Rank|Team|Paper|Dev|Eval')
        throw new Error('Missing CHiME-6 Track 2 ' + ranking);
      for (const c of table.slice(1)) {
        const href = c[2].html.match(/href="([^"]+)"/)?.[1];
        if (!c[1].text || !href || !c[3].text || !c[4].text || ![+c[3].text,+c[4].text].every(Number.isFinite))
          throw new Error('Invalid CHiME submission');
        rows.push({ model: c[1].text, submitter: c[1].text, setting: ranking, link: new URL(href, feed).href,
          score: +c[4].text, metrics: { dev: +c[3].text } });
      }
    }
    return rows;
  },
};

export default board;
