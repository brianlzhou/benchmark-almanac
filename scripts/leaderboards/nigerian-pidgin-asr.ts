// Nigerian Pidgin ASR measures word error rate on transcribed speech. The project poster's
// Model Comparison chart has a PDF text layer with test and validation WER as fractions.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = 'https://raw.githubusercontent.com/amina-mardiyyah/asr-nigerian-pidgin/main/static/images/Final_DLI_2025_Paper_26_Poster_Presentation_Submission.pdf';
const board: Leaderboard = {
  benchmark: 'nigerian-pidgin-asr', url: 'https://amina-mardiyyah.github.io/asr-nigerian-pidgin/', feed, static: 'paper',
  terms: 'The authors publish the poster and model comparison at https://amina-mardiyyah.github.io/asr-nigerian-pidgin/.',
  async fetch() {
    const block = (await pdfText(feed)).split('Model Comparison: Validation and Test WER')[1]?.split('*feature encoder')[0];
    if (!block || !/XLSR-53 \(Our[\s\S]*Wav2vec Base[\s\S]*Nemo[\s\S]*XLSR-53 English/.test(block)) throw new Error('Missing model comparison');
    const values = [...block.matchAll(/^.{0,102}?\b(0\.\d{3})\b/gm)].map(m => Number(m[1]) * 100);
    if (values.length !== 7) throw new Error('Expected seven WER values');
    return checked([
      {model: 'Wav2Vec2 XLSR-53', setting: 'Fine-tuned', score: values[0], metrics: {validationWer: values[1]}},
      {model: 'Wav2Vec2 Base-100H', setting: 'Fine-tuned', score: values[2], metrics: {validationWer: values[3]}},
      {model: 'NeMo QuartzNet', setting: 'Fine-tuned', score: values[4], metrics: {validationWer: values[5]}},
      {model: 'XLSR-53 English', setting: 'Zero-shot', score: values[6]},
    ], 4);
  },
};
export default board;
