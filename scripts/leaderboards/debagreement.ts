// DEBAGREEMENT tests whether a model detects agreement or disagreement in online debate replies.
// Table 2 reports accuracy and standard deviation for nine pretrained language-model configurations.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://datasets-benchmarks-proceedings.neurips.cc/paper/2021/file/6f3ef77ac0e3619e98159e9b6febf557-Paper-round2.pdf';
const models = ['BERT base uncased', 'BERT base cased', 'BERT large uncased', 'XLNet base', 'XLNet large',
  'RoBERTa base', 'RoBERTa large', 'DeBERTa base', 'DeBERTa large'];
const board: Leaderboard = {
  benchmark: 'debagreement', feed, url: feed, static: 'paper',
  terms: 'The authors publish the NeurIPS paper. https://datasets-benchmarks-proceedings.neurips.cc/',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 2: LMs accuracy for (dis)agreement detection')[1]?.split('We evaluate the performance')[0];
    // the PDF's text layer prints the first value as "62.4 %", so the percent sign may follow a space
    const normalized = table?.replace(/\s+/g, ' '); const values = normalized?.match(/(?<![\d.(])\d+\.\d+ ?%/g)?.map(v => parseFloat(v));
    const std = normalized?.match(/\((\d+\.\d+)%\)/g)?.map(v => Number(v.match(/\d+\.\d+/)![0]));
    if (!values || values.length !== 9 || !std || std.length !== 9) throw new Error('Missing DEBAGREEMENT results');
    return checked(models.map((model, i) => ({ model, score: values[i], metrics: { std: std[i] }, trials: 4 })), 9);
  },
};
export default board;
