// CLIP representation bias is the absolute distance from zero mean gender parity on ImageNet.
// Figure 2 shows the signed mean and error bars. The headline is the magnitude in percentage points.
// These chart values were read from PDF vector coordinates and checked independently against rendered bars.
// The PDF hash guards the transcription, which is rounded to one decimal percentage point.
import { createHash } from 'node:crypto';
import { fetchBytes } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';
const feed = 'https://proceedings.iclr.cc/paper_files/paper/2024/file/77c87a15bbf0aad017c53995b832cf84-Paper-Conference.pdf';
// Within each panel the order is baseline, balanced and proxies. Bounds refer to signed parity.
const panels: [string,string,number[][]][] = [
  ['ViT-S/32','100M examples, 384 dimensions',[[21.9,14.7,29.6],[11.5,-2.9,25.4],[-1.4,-10.4,14.4]]],
  ['ViT-B/32','100M examples, 384 dimensions',[[22.7,9,34.5],[14.4,-2.2,26.2],[4.7,-3.3,12.5]]],
  ['ViT-S/32','100M examples, 768 dimensions',[[15.4,5.7,24.6],[0.9,-2.3,4.9],[10.8,-1.1,21.1]]],
  ['ViT-B/32','100M examples, 768 dimensions',[[23.2,12.7,35],[2.9,-3.7,8.9],[9.6,-6.1,20.5]]],
  ['ViT-S/32','1B examples, 384 dimensions',[[25.2,20.2,29.9],[10.3,3.2,21.1],[16.2,6.6,24.6]]],
  ['ViT-B/32','1B examples, 384 dimensions',[[29.9,23.2,36],[10.1,4.6,17.1],[10.5,0,18.7]]],
  ['ViT-S/32','1B examples, 768 dimensions',[[28,24.1,32.6],[-5.1,-15.9,5.3],[-0.6,-12.9,10.9]]],
  ['ViT-B/32','1B examples, 768 dimensions',[[21.8,15.3,27.9],[22.8,10,29.4],[0.8,-3.5,9]]],
  ['ViT-B/16','Longer sequence',[[35.5,16.1,48.1],[18.7,13.4,23.4],[11.3,4.6,19.2]]],
];
export default {
  benchmark: 'clip-representation-bias-evaluation', static: 'paper', url: feed, feed,
  terms: 'ICLR proceedings, https://proceedings.iclr.cc/paper_files/paper/2024/hash/77c87a15bbf0aad017c53995b832cf84-Abstract-Conference.html',
  headline: 'The score is the magnitude of mean gender parity in Figure 2, in percentage points.',
  parts: { signedParity:'Signed mean parity', signedLow:'Signed lower error bar', signedHigh:'Signed upper error bar' },
  async fetch() {
    if (createHash('sha256').update(Buffer.from(await fetchBytes(feed))).digest('hex') !== '9e1460624b5c2f5e8ef7441931474457ed58ba466a3cf82dbb3a8b04c97fb8bd')
      throw new Error('Figure 2 source changed');
    const rows = panels.flatMap(([model, panel, values]) => values.map(([signedParity,signedLow,signedHigh],i) => ({
      model, setting: panel + ', ' + ['baseline','balanced','proxies'][i], trials: 3,
      score: Math.abs(signedParity), metrics: {signedParity,signedLow,signedHigh},
    })));
    return checked(rows,27);
  },
} satisfies Leaderboard;
