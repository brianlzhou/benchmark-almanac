// MIREX ranks piano difficulty predictions by Kendall's tau-c. The wiki lists the number of pieces, runtime and each submission's paper.
import type { Leaderboard } from './types.ts';
import { tables, num } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://futuremirex.com/mirex/wiki/2026:Music_Performance_Difficulty_Prediction_Results";
const board: Leaderboard = {
  benchmark: 'mirex-2026-music-performance-difficulty-prediction',
  url: "https://futuremirex.com/mirex/wiki/2026:Music_Performance_Difficulty_Prediction_Results",
  feed,
  terms: "The mirror has no robots file. The wiki lists the GNU Free Documentation License 1.2 for its content. https://futuremirex.com/mirex/wiki/2026:Music_Performance_Difficulty_Prediction_Results",
  async fetch() {
    const all = tables(await fetchText(feed));
    const results = all.find(t => t[0]?.map(c => c.text).join('|') === "Submission|Songs evaluated|Average time per song|Kendall's τ-c");
    const submissions = all.find(t => t[0]?.[1]?.text === 'PDF');
    if (!results || results.length < 4 || !submissions) throw new Error('Missing MIREX results');
    return results.slice(1).map(c => {
      const model = c[0].text, score = num(c[3].text), trials = num(c[1].text), latency = num(c[2].text);
      const submission = submissions.find(r => r[0].text === model);
      const href = submission?.[1].html.match(/href="([^"]+)"/)?.[1];
      if (!model || !href || score == null || !trials || latency == null) throw new Error('Missing MIREX submission');
      return { model, submitter: model, score, trials, metrics: { latency }, link: new URL(href, feed).href };
    });
  },
};
export default board;
