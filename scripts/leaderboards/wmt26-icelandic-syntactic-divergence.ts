// The WMT26 Icelandic syntax test ranks human construction accuracy.
// Table 2 of the organizers' paper gives system means, sampling intervals and evaluation counts.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2026.wmt-main.91.pdf";
const board: Leaderboard = {
  benchmark: "wmt26-icelandic-syntactic-divergence", static: 'paper',
  url: "https://aclanthology.org/2026.wmt-main.91.pdf",
  feed,
  terms: "Table 2 ranks human construction accuracy. The JSON contains individual judgments. The repository lists no license. ACL Anthology returned 404 for robots.txt.",
  async fetch() {
    const doc = await pdfText(feed);
    const end = doc.indexOf('Table 2: An overview of all models');
    const start = doc.lastIndexOf('System ', end);
    const lines = doc.slice(start, end).trim().split(/\r?\n/);
    if (!lines.shift()?.includes('Constr. Acc.') || lines.length < 27) throw new Error('Missing manual evaluation table');
    return lines.map(line => {
      const cells = line.trim().split(/\s{2,}/);
      const interval = (s: string) => {
        const m = s?.match(/^(\d+\.\d+)% ± (\d+\.\d+)$/);
        if (!m) throw new Error('Invalid human score interval');
        return [Number(m[1]), Number(m[2])];
      };
      const [model, count, judged, ratings, construction, meaning, translation] = cells;
      const [score, width] = interval(construction);
      const [meaningPreserved, meaningWidth] = interval(meaning);
      const [translationAccuracy, translationWidth] = interval(translation);
      if (!model || ![count, judged, ratings].every(v => /^\d+$/.test(v))) throw new Error('Missing rating counts');
      return { model, score, low: score - width, high: score + width, metrics: { translations: Number(count), evaluated: Number(judged), ratings: Number(ratings),
        meaningPreserved, meaningWidth, translationAccuracy, translationWidth } };
    });
  },
};
export default board;
