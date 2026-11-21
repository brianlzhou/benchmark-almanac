// PUMaVOS evaluates video object masks. SOTA2 ranks its validation results by Jaccard index (J).
// The table also publishes boundary F-measure, combined J&F, frame rate and video memory for each method.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { fetchText } from '../lib/util.ts';
const feed = 'https://www.sota2.com/research/sota/video-object-segmentation-on-pumavos-val';
const board: Leaderboard = {
  benchmark: 'pumavos', host: 'SOTA2 Research', url: feed, feed,
  terms: 'Public SOTA2 Research results credited to the linked papers. ' + feed,
  parts: { f: 'F-Measure (F)', jf: 'J&F Score' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t =>
      t[0]?.map(c => c.text).join('|') === 'Method|Links|Jaccard Index (J)|F-Measure (F)|J&F Score');
    if (!table) throw Error('Missing PUMaVOS validation results');
    return checked(table.slice(1).map(r => {
      const [method,,j,f,jf] = r.map(c => c.text);
      const model = method.split(' FPS=')[0];
      const details = [...method.matchAll(/FPS=([\d.]+), VRAM \(GB\)=([\d.]+)(?:, Refinements=(\d+))?/g)].at(-1);
      if (!details) throw Error('Missing model configuration: ' + method);
      return { model, score: numberCell(j), setting: details[3] ? details[3] + ' refinements' : undefined,
        metrics: { f: numberCell(f), jf: numberCell(jf), fps: numberCell(details[1]), vramGB: numberCell(details[2]) } };
    }), 7);
  },
};
export default board;
