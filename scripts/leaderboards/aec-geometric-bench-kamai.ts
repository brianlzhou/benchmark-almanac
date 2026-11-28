// Kamai measures object detection and segmentation on architectural drawings.
// The README ranks six systems by pooled object F1 on 312 sheets and reports a 15-sheet public subset.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/KamaiEnterprises/aec-geometric-bench/main/README.md";
const board: Leaderboard = {
  benchmark: "aec-geometric-bench-kamai",
  url: "https://kamai.io/blog/aec-geometric-bench",
  feed: FEED,
  costPer: 'task',
  terms: "Kamai licenses released drawings and derived dataset files under CC BY-NC 4.0 and the scorer under Apache 2.0. https://github.com/KamaiEnterprises/aec-geometric-bench/blob/main/dataset/LICENSE-DATA.md Kamai's robots.txt allows the article.",
  parts: { wall: 'Wall pixel F1', area: 'Area pixel F1', instance: 'Area instance F1', releasedF1: 'Object F1 on 15 released sheets', releasedWall: 'Wall pixel F1 on 15 released sheets', releasedArea: 'Area pixel F1 on 15 released sheets', releasedInstance: 'Area instance F1 on 15 released sheets' },
  stats: {
    precision: { name: 'Precision', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    recall: { name: 'Recall', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    releasedPrecision: { name: 'Released-sheet precision', unit: 'score', better: 'higher', note: 'Precision on 15 released sheets, stored from 0 to 1.' },
    releasedRecall: { name: 'Released-sheet recall', unit: 'score', better: 'higher', note: 'Recall on 15 released sheets, stored from 0 to 1.' },
    latency: { name: 'Median time per sheet', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const tables = markdownTables(await fetchText(FEED));
    const columns = 'system|P|R|F1|wall px|area px|area inst';
    const matching = tables.filter(t => t[0]?.slice(0, 7).join('|') === columns && t.length >= 7);
    const full = matching.find(t => t[0][7]?.includes('median')) ?? matching[0];
    const released = matching.find(t => t[0][7]?.includes('range')) ?? matching[1];
    if (!full || !released || full === released) throw new Error('Missing AEC results');
    return full.slice(1).map(([model, ...cells]) => {
      const subset = released.slice(1).find(row => row[0] === model);
      if (!subset) throw new Error('Missing released-sheet scores for ' + model);
      const values = [...cells.slice(0, 6), ...subset.slice(1, 7)];
      if (values.length !== 12 || values.some(v => !v || !Number.isFinite(Number(v)))) throw new Error('Invalid AEC score for ' + model);
      const [precision, recall, score, wall, area, instance, releasedPrecision, releasedRecall, releasedF1, releasedWall, releasedArea, releasedInstance] = values.map(Number);
      const minutes = cells[6] && /^\d+(?:\.\d+)?$/.test(cells[6].trim()) ? Number(cells[6].trim()) : undefined;
      const price = cells[7]?.trim().match(/^\$(\d+(?:\.\d+)?)$/)?.[1];
      return { model, score, ...(price ? { cost: Number(price) } : {}),
        metrics: { precision, recall, wall, area, instance, releasedPrecision, releasedRecall, releasedF1, releasedWall, releasedArea, releasedInstance,
          ...(minutes !== undefined ? { latency: minutes * 60 } : {}) } };
    });
  },
};
export default board;
