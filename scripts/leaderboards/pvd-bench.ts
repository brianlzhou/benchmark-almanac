// PVD Bench evaluates fine-grained video-caption retrieval.
// Table 7 reports text-to-video and video-to-text recall percentages with no overall score.
// The headline uses the first retrieval direction and keeps the other direction as a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2504.13181';
const board: Leaderboard = {
  benchmark: 'pvd-bench', static: 'paper', url: 'https://arxiv.org/abs/2504.13181', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2504.13181',
  headline: 'The paper reports no overall score, so this is the text-to-video retrieval column, which it lists first.',
  parts: { textToVideo: 'PVD Bench text to video', videoToText: 'PVD Bench video to text' },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 7 Additional Zero-Shot Results')) throw new Error('PVD Table 7 missing');
    const values: Array<[string, number, number]> = [
      ['SigLIP2-B/16', 53.9, 60.1], ['PEcore B', 59.8, 61.1], ['SigLIP2-L/16', 61.9, 67.1],
      ['PEcore L', 64.7, 65.2], ['InternVL-C', 63.4, 65.1], ['SigLIP2-g-opt', 62.5, 67.1], ['PEcore G', 77.0, 76.6],
    ];
    const rows = values.map(([model, textToVideo, videoToText]) => ({ model, score: textToVideo, metrics: { textToVideo, videoToText } }));
    return checked(rows, 7);
  },
};
export default board;
