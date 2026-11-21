// TECCI tests instruction-based image editing on challenging collected and curated images.
// Table 4 reports autorater success rates on the full benchmark, including the combined Overall column.
// This importer reads the paper and keeps the human-evaluation results from Table 2 as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/pdf/2606.01213';
const rows: LeaderboardRow[] = [
  { model: 'Nano Banana Pro', setting: 'autorater, full benchmark', score: 19.8, metrics: { autoIF: 59.5, autoIC: 43.2, autoVQ: 39.9, autoOverall: 19.8, humanIF: 46.0, humanIC: 42.1, humanVQ: 38.0, humanOverall: 22.3, humanIRCSOverall: 19.7, humanGGISOverall: 23.0 } },
  { model: 'Nano Banana 2', setting: 'autorater, full benchmark', score: 19.5, metrics: { autoIF: 65.9, autoIC: 37.1, autoVQ: 45.0, autoOverall: 19.5, humanIF: 45.6, humanIC: 35.3, humanVQ: 34.4, humanOverall: 19.7, humanIRCSOverall: 17.7, humanGGISOverall: 20.2 } },
  { model: 'GPT Image 1.5', setting: 'autorater, full benchmark', score: 4.7, metrics: { autoIF: 55.4, autoIC: 5.4, autoVQ: 30.0, autoOverall: 4.7, humanIF: 42.0, humanIC: 9.6, humanVQ: 21.0, humanOverall: 5.7, humanIRCSOverall: 4.9, humanGGISOverall: 5.9 } },
  { model: 'Grok Imagine Pro', setting: 'autorater, full benchmark', score: 19.3, metrics: { autoIF: 60.1, autoIC: 38.2, autoVQ: 44.4, autoOverall: 19.3, humanIF: 46.9, humanIC: 39.2, humanVQ: 36.6, humanOverall: 20.0, humanIRCSOverall: 14.7, humanGGISOverall: 21.3 } },
  { model: 'Seedream 5.0 Lite', setting: 'autorater, full benchmark', score: 18.6, metrics: { autoIF: 54.3, autoIC: 42.7, autoVQ: 39.4, autoOverall: 18.6, humanIF: 41.4, humanIC: 38.4, humanVQ: 28.5, humanOverall: 16.7, humanIRCSOverall: 10.3, humanGGISOverall: 18.2 } },
];

const board: Leaderboard = {
  benchmark: 'tecci',
  static: 'paper',
  url: 'https://google-deepmind.github.io/tecci/',
  feed: FEED,
  stats: {
    autoIF: { name: 'Autorater instruction following', unit: '%', better: 'higher' },
    autoIC: { name: 'Autorater image consistency', unit: '%', better: 'higher' },
    autoVQ: { name: 'Autorater visual quality', unit: '%', better: 'higher' },
    autoOverall: { name: 'Autorater overall success rate', unit: '%', better: 'higher' },
    humanIF: { name: 'Human instruction following', unit: '%', better: 'higher' },
    humanIC: { name: 'Human image consistency', unit: '%', better: 'higher' },
    humanVQ: { name: 'Human visual quality', unit: '%', better: 'higher' },
    humanOverall: { name: 'Human overall success rate', unit: '%', better: 'higher' },
    humanIRCSOverall: { name: 'Human Instruction Rich Challenge Set success rate', unit: '%', better: 'higher' },
    humanGGISOverall: { name: 'Human Gemini Generated Instruction Set success rate', unit: '%', better: 'higher' },
  },
  terms: 'The paper is available from arXiv under its access terms. The annotations and images use CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  async fetch() {
    const paper = await pdfText(FEED);
    if (!paper.includes('Table 2: Human-based success rate') || !paper.includes('Table 4: Autorater-based success rate')) throw new Error('TECCI result tables missing');
    return checked(rows, 5);
  },
};

export default board;
