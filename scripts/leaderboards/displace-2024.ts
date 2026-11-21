// DISPLACE tests Indian multilingual conversational speech. Figure 2 reports the best speaker diarization error rate across the two evaluation phases.
// Section 6.1 describes the top three systems. Section 5.1 describes the ETDNN-based baseline.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.isca-archive.org/interspeech_2024/kalluri24_interspeech.pdf';
const board: Leaderboard = {
  benchmark: 'displace-2024', url: feed, feed,
  terms: 'The authors publish their results in the ISCA Archive. https://www.isca-archive.org/interspeech_2024/kalluri24_interspeech.html',
  parts: { sd: { name: 'Speaker Diarization', unit: '%', better: 'lower' } }, harnesses: 'system',
  async fetch() {
    const paper = await pdfText(feed);
    const chart = paper.split('Track 1 Baseline:')[1]?.split('Figure 2: DER (%)')[0];
    if (!chart || !/T1\s+T2\s+T3\s+T4/.test(chart)) throw new Error('Missing DISPLACE Track 1 chart');
    const baseline = chart.trim().match(/^(\d+\.\d+)/);
    const first = chart.match(/^\s*25\s+(\d+\.\d+)\s*$/m);
    const secondThird = chart.match(/Fig 1\.\s+(\d+\.\d+)\s+(\d+\.\d+)\s*$/m);
    if (!baseline || !first || !secondThird) throw new Error('Track 1 chart labels changed');
    const rows = [
      { model: 'ETDNN', harness: 'DISPLACE 2024 baseline', submitter: 'DISPLACE', score: Number(baseline[1]) },
      { model: 'Wav-LM', harness: 'Pyannote ensemble with DOVER-Lap', submitter: 'T1', score: Number(first[1]) },
      { model: 'ResNet-152', harness: 'Seven-model fusion with Pyannote overlap detection', submitter: 'T2', score: Number(secondThird[1]) },
      { model: 'Titanet-L', harness: 'Speaker segmentation and spectral clustering', submitter: 'T3', score: Number(secondThird[2]) },
    ];
    return checked(rows.map(row => ({ ...row, metrics: { sd: row.score } })), 4);
  },
};
export default board;
