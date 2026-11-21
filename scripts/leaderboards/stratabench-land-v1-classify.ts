// StrataBench Land v1 Classify tests identification of the legal act in 66 recorded instruments.
// Table 8 reports parent-type accuracy on the full panel under five prompt settings.
// The v2 dataset card identifies this paper as the source for the withdrawn v1 release.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://huggingface.co/datasets/Collide-ai/stratabench-land-v2/resolve/main/oilbench_landscape_1.pdf';
const settings = ['R0 open', 'R1 types', 'R2 disambiguation', 'R3 overrides', 'R4 full'];
const board: Leaderboard = {
  benchmark: 'stratabench-land-v1-classify', static: 'paper', feed, url: feed,
  terms: 'Collide publishes the paper in its CC BY-NC 4.0 dataset repository. https://huggingface.co/datasets/Collide-ai/stratabench-land-v2',
  async fetch() {
    const text = await pdfText(feed);
    const table = text.match(/Model\s+R0 open\s+R1 types\s+R2 disambig\.\s+R3 overrides\s+R4 full\s+([^]*?)Table 8: Accuracy on the same 66 instruments/);
    if (!table) throw new Error('Missing Classify Table 8');
    const rows = table[1].trim().split('\n').flatMap(line => {
      const match = line.trim().match(/^(.+?)\s+(\.\d+(?:\s+\.\d+){4})$/);
      if (!match) throw new Error('Unexpected Classify row: ' + line);
      return match[2].split(/\s+/).map((value, i) => ({ model: match[1], setting: settings[i], score: Number((100 * Number(value)).toFixed(2)) }));
    });
    return checked(rows, 25);
  },
};
export default board;
