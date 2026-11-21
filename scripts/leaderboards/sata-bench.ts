// SATA-Bench tests select-all-that-apply question answering for language models.
// The paper's primary performance column is Jaccard Index, reported as a percentage.
// This importer reads the paper's Table 2 and keeps exact match, precision, recall and count accuracy.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const url = 'https://github.com/sata-bench/sata-bench';
const feed = 'https://cdn.amazon.science/b7/db/91e1266b4637a2a5569393bbf5ac/sata-bench.pdf';
const board: Leaderboard = {
  benchmark: 'sata-bench', url, feed, static: 'paper',
  terms: 'The paper is publicly available from Amazon Science. Cite the authors and follow the paper terms.',
  parts: {},
  async fetch(): Promise<LeaderboardRow[]> {
    const paper = await pdfText(feed);
    const section = paper.split('Table 2: Performance comparison')[1]?.split('3.1   E VALUATION')[0];
    if (!section) throw new Error('SATA-Bench Table 2 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      const match = line.match(/^\s*(.+?)\s{2,}(\d+\.\d+)\s+(\d+\.\d+|–)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(-?\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s*$/);
      if (!match || /Human|Model Name|Performance|Retrieval|Bias/.test(match[1])) continue;
      const [, model, ji, fpr, em, precision, spd, rstd, rsd, ctdif, ctdifabs, ctacc] = match;
      if (/^Non-expert Human$/i.test(model)) continue;
      const setting = section.slice(0, section.indexOf(line)).includes('Probability Based Retrieval') ? 'Probability based retrieval' : 'Inference based retrieval and chain of thought';
      rows.push({ model: model.trim(), setting, score: Number(ji), metrics: { fpr: Number(fpr), em: Number(em), precision: Number(precision), spd: Number(spd), rstd: Number(rstd), rsd: Number(rsd), ctdif: Number(ctdif), ctdifabs: Number(ctdifabs), ctacc: Number(ctacc) } });
    }
    if (rows.length < 2) throw new Error('SATA-Bench Table 2 rows missing');
    return rows;
  },
};
export default board;
