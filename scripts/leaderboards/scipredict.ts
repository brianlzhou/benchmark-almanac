// Scale's standalone SciPredict board publishes the whole-set score and confidence margin.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';
const PAGE = scaleUrl('scipredict');
const board: Leaderboard = {
  benchmark: 'scipredict', url: PAGE, feed: scaleFeed(PAGE),
  terms: 'Scale terms prohibit automated extraction; the almanac credits Scale AI and links the source.',
  aliases: SCALE_ALIASES,
  async fetch() {
    const rows = scaleRows(await fetchScaleEntries(PAGE), (_: unknown, e: any) => typeof e.confidenceInterval_upper === 'number' ? { metrics: { ciMargin: e.confidenceInterval_upper } } : undefined);
    return rows.map(r => /^(DeepSeek-V3|gemini-2\.5-pro)$/i.test(r.model) ? { ...r, model: `${r.model} (snapshot unspecified)` } : r);
  },
};
export default board;
