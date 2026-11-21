// The source reports no overall score. The headline is the plain mean of the 8 parts, computed by this importer.
// Table 5 evaluates retrieval on Oxford and Paris with two difficulty protocols, with and without one million distractors.
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';
const feed = 'https://openaccess.thecvf.com/content_cvpr_2018/papers/Radenovic_Revisiting_Oxford_and_CVPR_2018_paper.pdf';
const parts = ['Medium', 'Hard'].flatMap(level => ['ROxf', 'ROxf+R1M', 'RPar', 'RPar+R1M'].map(dataset => level + ' ' + dataset));
const board: Leaderboard = {
  benchmark: 'revisited-oxford-and-paris', url: feed, feed, static: 'paper',
  terms: 'The authors retain copyright under the CVF open-access terms at https://openaccess.thecvf.com/.',
  headline: 'The paper reports no overall score, so this is the plain mean of its eight mean average precision scores.',
  parts: Object.fromEntries(parts.map(name => [name, name])),
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split(/Method\s+ROxf\s+ROxf\+R1M\s+RPar\s+RPar\+R1M\s+ROxf\s+ROxf\+R1M\s+RPar\s+RPar\+R1M/)[1]?.split('Table 5. Performance evaluation')[0];
    if (!table || !/(?:mAP\s+mP@10\s*){8}/.test(table)) throw new Error('Missing Table 5 retrieval metrics');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split('\n')) {
      if (!/^(?:[AVR] |DELF|HesAff)/.test(line) || (line.startsWith('HesAff') && !line.includes('→'))) continue;
      const [label, ...values] = line.trim().split(/\s{2,}/);
      const numbers = values.flatMap(cell => cell.split(/\s+/).map(Number));
      if (numbers.length !== 16 || !numbers.every(Number.isFinite)) throw new Error('Invalid results for ' + label);
      const metrics: Record<string, number> = {};
      parts.forEach((key, i) => { metrics[key] = numbers[2*i]; metrics[key + ' mP@10'] = numbers[2*i+1]; });
      // Bracketed references identify different trained networks in the source method labels.
      const model = label.replace(/\[(\d+)\]/g, '(ref. $1)');
      rows.push({model, score: parts.reduce((sum, part) => sum + metrics[part], 0) / parts.length, metrics});
    }
    return checked(rows, 31);
  },
};
export default board;
