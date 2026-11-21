// Ref-ZOM tests referring image segmentation for one-to-many and one-to-zero expressions.
// The headline score is oIoU, with mIoU and one-to-zero accuracy kept as metrics.
// This importer reads Table 2 of the benchmark paper.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED = 'https://openaccess.thecvf.com/content/ICCV2023/papers/Hu_Beyond_One-to-One_Rethinking_the_Referring_Image_Segmentation_ICCV_2023_paper.pdf';
const board: Leaderboard = {
  benchmark: 'ref-zom', static: 'paper', url: 'https://openaccess.thecvf.com/content/ICCV2023/html/Hu_Beyond_One-to-One_Rethinking_the_Referring_Image_Segmentation_ICCV_2023_paper.html', feed: FEED,
  terms: 'The paper is provided under the Computer Vision Foundation open-access terms. https://openaccess.thecvf.com/content/ICCV2023/html/Hu_Beyond_One-to-One_Rethinking_the_Referring_Image_Segmentation_ICCV_2023_paper.html',
  async fetch() {
    const text = await pdfText(FEED);
    const section = text.split('Table 2: Comparisons with some representative methods on')[1]?.split('Table 3:')[0];
    if (!section) throw new Error('Ref-ZOM Table 2 missing');
    const matches = [...section.matchAll(/\n\s*(MCN|CMPC|VLT|LAVT|DMMI \(Ours\))(?: \[[0-9]+\])?\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)/g)];
    if (matches.length !== 5) throw new Error(`Ref-ZOM Table 2 rows changed: ${matches.length}`);
    return matches.map((m) => ({ model: m[1], score: Number(m[2]), metrics: { mIoU: Number(m[3]), accuracy: Number(m[4]) } }));
  },
};
export default board;
