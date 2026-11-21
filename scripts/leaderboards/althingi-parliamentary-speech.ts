// Althingi Parliamentary Speech tests Icelandic speech recognition.
// Table 2 reports evaluation-set word error rate for five acoustic models.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://www.isca-archive.org/interspeech_2017/helgadottir17_interspeech.pdf';
const board: Leaderboard = {
  benchmark: 'althingi-parliamentary-speech', url: 'https://www.isca-archive.org/interspeech_2017/helgadottir17_interspeech.html', feed, static: 'paper',
  terms: 'The ISCA Archive publishes this paper for research use. https://www.isca-archive.org/terms.html',
  stats: { developmentWer: { name: 'Development word error rate', unit: '%', better: 'lower' } },
  async fetch() {
    const text = await pdfText(feed);
    const start = text.indexOf('Acoustic model      Development set       Evaluation set');
    const section = text.slice(start, start + 1200);
    const rows = Array.from(section.matchAll(/(GMM-SAT|DNN|TD-DNN(?: w\/sp)?|LSTM-RNN)\s+([\d.]+)\s+([\d.]+)/g))
      .map(([, model, dev, evaluation]) => ({ model, score: Number(evaluation), metrics: { developmentWer: Number(dev) } }));
    return checked(rows, 5);
  },
};
export default board;
