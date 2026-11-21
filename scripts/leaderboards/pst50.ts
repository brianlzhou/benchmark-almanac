// PST50 tests photorealistic style transfer. Table 2 gives perceptual distance to the ground truth on the paired images.
// Lower LPIPS is better. The table also reports pixel fidelity, structural similarity, histogram correlation and inference time.
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';
const feed = 'https://openaccess.thecvf.com/content/ICCV2025/papers/Gong_SA-LUT_Spatial_Adaptive_4D_Look-Up_Table_for_Photorealistic_Style_Transfer_ICCV_2025_paper.pdf';
const board: Leaderboard = {
  benchmark: 'pst50', url: feed, feed, static: 'paper',
  terms: 'The authors retain copyright under the CVF open-access terms at https://openaccess.thecvf.com/.',
  stats: {
    psnr: { name: 'Peak signal-to-noise ratio', unit: 'score', better: 'higher' },
    ssim: { name: 'Structural similarity', unit: 'score', better: 'higher' },
    hCorr: { name: 'Histogram correlation', unit: 'score', better: 'higher' },
    inferenceSeconds: { name: 'Inference time', unit: 'seconds', better: 'lower' },
    lutGenerationSeconds: { name: 'Look-up table generation time', unit: 'seconds', better: 'lower' },
    lutApplicationSeconds: { name: 'Look-up table application time', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split(/Method\s+LPIPS ↓ PSNR \S+ SSIM \S+ H-Corr \S+ Inference Time \(s\)/)[1]?.split('5. Experiments')[0];
    if (!table) throw new Error('Missing Table 2 image quality and timing columns');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split('\n')) {
      const match = line.match(/\s{2,}([\w][\w -]*?) (?:\[\d+\]|\(Ours\))\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(N\/A|[\d.]+)(?:\s*\+\s*([\d.]+))?\s*$/);
      if (!match) continue;
      const [, model, lpips, psnr, ssim, hCorr, first, second] = match;
      const metrics: Record<string, number> = {psnr: Number(psnr), ssim: Number(ssim), hCorr: Number(hCorr)};
      if (first !== 'N/A') metrics.inferenceSeconds = Number(first) + Number(second ?? 0);
      if (second) Object.assign(metrics, {lutGenerationSeconds: Number(first), lutApplicationSeconds: Number(second)});
      rows.push({model, score: Number(lpips), metrics});
    }
    return checked(rows, 7);
  },
};
export default board;
