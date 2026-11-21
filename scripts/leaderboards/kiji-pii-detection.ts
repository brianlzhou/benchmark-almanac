// PII Arena ranks detectors on Kiji English by the percentage of gold annotations fully hidden.
// Read the published counts for measured detectors, excluding training overlaps and separate ensemble experiments.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://www.piiarena.com/data/all-results.csv";
const board: Leaderboard = {
  benchmark: "kiji-pii-detection",
  url: "https://www.piiarena.com/datasets/kiji-en",
  feed: FEED,
  terms: "PII Arena licenses its original publication material under MIT. Dataiku licenses the source under Apache 2.0. https://github.com/Quakeer444/pii-arena/blob/main/README.md PII Arena robots.txt allows the feed.",
  async fetch() {
    const detectors = parseCsv(await fetchText(FEED)).filter(r => r.dataset === 'kiji-en' && r.train === 'false' && r.system.startsWith('model:'));
    if (detectors.length < 41) throw new Error('Missing Kiji detectors');
    return detectors.map(r => {
      const metrics: Record<string, number> = {};
      for (const key of ['gold','hit','hidden','rawHidden','tp','fp','fn','negativeChars','maskedNegativeChars','negativeRows','touchedNegativeRows','positiveRows','residualRows']) {
        if (!r[key] || !Number.isFinite(Number(r[key]))) throw new Error('Missing Kiji count ' + key);
        metrics[key] = Number(r[key]);
      }
      if (metrics.gold <= 0) throw new Error('Missing Kiji annotations');
      metrics.detected = metrics.hit / metrics.gold * 100;
      metrics.charF1 = 2 * metrics.tp / (2 * metrics.tp + metrics.fp + metrics.fn);
      const model = r.system.slice('model:'.length);
      return { model, score: metrics.hidden / metrics.gold * 100, metrics, link: 'https://www.piiarena.com/detectors/' + encodeURIComponent(model) };
    });
  },
};
export default board;
