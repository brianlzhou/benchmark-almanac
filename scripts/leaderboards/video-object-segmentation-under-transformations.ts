// VOST tests segmentation of transforming objects. Table 2 identifies Jtr, mask IoU over the final quarter of each sequence, as the main metric.
// The headline uses the VOST test set. Validation and full-sequence IoUs are also reported.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://openaccess.thecvf.com/content/CVPR2023/papers/Tokmakov_Breaking_the_Object_in_Video_Object_Segmentation_CVPR_2023_paper.pdf';
const board: Leaderboard = {
  benchmark: 'video-object-segmentation-under-transformations', url: 'https://www.vostdataset.org/', feed, static: 'paper',
  terms: 'CVF publishes the authors’ paper for open access at https://openaccess.thecvf.com/CVPR2023.',
  parts: { valJtr: 'Validation Jtr', valJ: 'Validation J', testJ: 'Test J' },
  async fetch() {
    const paper = await pdfText(feed);
    const block = paper.match(/VOST val\s+VOST test\s+DAVIS’17 val([\s\S]*?)Table 2\. Benchmarking existing methods on VOST/)?.[1];
    if (!block || !/Jtr\s+J\s+Jtr\s+J/.test(block)) throw new Error('VOST Table 2 missing');
    const rows = [...block.matchAll(/^\s*([^\n\[]+?)\s*\[\d+\]\s+([\d.]+(?:[ \t]+[\d.]+){5})[ \t]*$/gm)].map(m => {
      const [valJtr,valJ,score,testJ] = m[2].split(/\s+/).map(Number);
      return { model: m[1].trim(), score, metrics: { valJtr,valJ,testJ } };
    });
    return checked(rows, 9);
  },
};
export default board;
