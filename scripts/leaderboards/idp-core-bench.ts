// Nanonets evaluates four document processing tasks. The leaderboard page embeds each model's overall IDP score
// and task scores separately from results on the site's other benchmarks.
import type { Leaderboard } from './types.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://www.idp-leaderboard.org/benchmarks/idp";
type Entry = { model_name: string; slug: string; type: string; scores: { idp?: Record<string, number> } };

const board: Leaderboard = {
  benchmark: "idp-core-bench",
  url: "https://www.idp-leaderboard.org/benchmarks/idp",
  feed,
  terms: "The benchmark page gives no license for the scores. The code has an Apache 2.0 license. robots.txt allows the feed path.",
  parts: { kie: 'KIE', ocr: 'OCR', table: 'Table', vqa: 'VQA' },
  async fetch() {
    const entries = jsonAfter<Entry[]>(nextFlight(await fetchText(feed)), '"entries":').filter(e => e.scores.idp);
    if (entries.length < 27) throw new Error('Missing IDP model results');
    return entries.map(e => {
      const { overall, kie, ocr, table, vqa } = e.scores.idp!;
      if (!e.model_name || ![overall, kie, ocr, table, vqa].every(Number.isFinite)) throw new Error('Incomplete IDP score');
      return { model: e.model_name, score: overall, open: e.type === 'open', link: new URL('/models/' + e.slug, feed).href,
        metrics: { kie, ocr, table, vqa } };
    });
  },
};
export default board;
