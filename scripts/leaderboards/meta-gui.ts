// META-GUI ranks Android agents by action completion rate. The authors publish each test result in the HTML standings.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';

const FEED = "https://x-lance.github.io/META-GUI-Leaderboard/";
const board: Leaderboard = {
  benchmark: "meta-gui",
  url: "https://x-lance.github.io/META-GUI-Leaderboard/",
  feed: FEED,
  terms: "The leaderboard gives no reuse terms for the scores. https://x-lance.github.io/META-GUI-Leaderboard/ The host has no published robots directives at /robots.txt.",
  parts: { turn: 'Turn CR', reply: { name: 'Reply BLEU score', unit: 'score' } },
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0]?.map(c => c.text).join('|') === 'Rank|Model|Action CR|Turn CR|Reply BLEU score');
    if (!table || table.length < 5) throw new Error('Missing META-GUI results');
    return table.slice(1).map(([rank, entry, action, turn, reply]) => {
      const model = text(entry.html.split('<p>')[0]);
      const values = [action, turn, reply].map(c => c.text ? Number(c.text) : NaN);
      if (!model || !values.every(Number.isFinite)) throw new Error('Incomplete META-GUI row');
      const date = rank.html.match(/<span>([^<]+)</)?.[1];
      return { model, score: values[0], metrics: { turn: values[1], reply: values[2] },
        submitter: entry.html.match(/<p>([^<]+)</)?.[1], link: entry.html.match(/href="([^"]+)"/)?.[1],
        date: date ? new Date(date + ' UTC').toISOString().slice(0, 10) : undefined };
    });
  },
};
export default board;
