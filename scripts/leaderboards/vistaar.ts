// Vistaar reports average word error rate across Indian languages and speech datasets.
// Table 4 in the authors' paper gives complete averages for three systems.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://arxiv.org/pdf/2305.15386";

const board: Leaderboard = {
  benchmark: "vistaar", static: 'paper',
  url: "https://github.com/AI4Bharat/vistaar#benchmarks",
  feed: FEED,
  terms: "The six-model table covers the seven Hindi tests. The larger table lists IndicWhisper by language and dataset. The README gives no score reuse terms. https://github.com/AI4Bharat/vistaar GitHub requests a one-second crawl delay.",
  async fetch() {
    const pdf = await pdfText(FEED);
    const table = pdf.split(/Table 4: Performance of Publicly available models on the Vistaar Benchmark/i)[1]?.split('4.1. ASR systems compared')[0];
    if (!table) throw new Error('Missing Vistaar Table 4');
    const header = table.match(/Datasets\s+((?:[a-z]{2}\s+){12})avg/);
    if (!header) throw new Error('Missing Vistaar languages');
    const languages = header[1].trim().split(/\s+/);
    const rows = [];
    const parts: Record<string, string> = {};
    let model = '';
    let metrics: Record<string, number> = {};
    for (const line of table.split('\n').map(x => x.trim()).filter(Boolean)) {
      if (line.startsWith('Datasets')) continue;
      const match = line.match(/^(.+?)\s{2,}([\d.NA -]+)$/);
      if (!match) { model = line; metrics = {}; continue; }
      const [, dataset, fields] = match;
      const values = fields.trim().split(/\s+/);
      if (model === 'Azure STT') continue;
      if (values.length !== 13 || !model) throw new Error('Invalid Vistaar columns');
      values.forEach((value, i) => {
        if (value === '-' || value === 'NA' || (dataset === 'Average' && i === 12)) return;
        const key = dataset === 'Average' ? languages[i] : i === 12 ? dataset : dataset + ' / ' + languages[i];
        if (!Number.isFinite(Number(value))) throw new Error('Invalid Vistaar WER');
        parts[key] = key; metrics[key] = Number(value);
      });
      if (dataset === 'Average' && values[12] !== '-') rows.push({ model, score: Number(values[12]), metrics });
    }
    if (rows.length < 3) throw new Error('Missing complete Vistaar averages');
    board.parts = parts;
    return rows;
  },
};
export default board;
