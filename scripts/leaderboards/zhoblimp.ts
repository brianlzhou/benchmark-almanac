// ZhoBLiMP tests whether a model prefers the grammatical sentence in a Chinese minimal pair.
// Table 6 reports overall accuracy under three scoring rules and 15 phenomenon scores under SLLN-LP.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.tacl-1.34.pdf';
const board: Leaderboard = {
  benchmark: 'zhoblimp', feed, url: feed, static: 'paper',
  terms: 'ACL Anthology terms apply to this TACL paper. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const paper = await pdfText(feed);
    const header = /Zh-Pythia\s+Qwen2\.5\s+Gap\s+Human\s+Phenomenon\s+14M\s+70M\s+160M\s+410M\s+1\.4B\s+7B\s+14B/;
    const table = paper.split(header)[1]?.split('Table 6: Accuracy of Zh-pythia')[0];
    if (!table) throw new Error('Missing Table 6 model headers');
    const models = ['Zh-Pythia-14M', 'Zh-Pythia-70M', 'Zh-Pythia-160M', 'Zh-Pythia-410M', 'Zh-Pythia-1.4B', 'Qwen2.5-7B', 'Qwen2.5-14B'];
    const metrics: Record<string, number>[] = models.map(() => ({}));
    const parts: Record<string, string> = {};
    const rows: LeaderboardRow[] = [];
    for (const line of table.trim().split('\n').filter(s => s.trim())) {
      const match = line.match(/^([A-Z. -]+?)\s{2,}(.+)$/);
      if (!match) throw new Error('Invalid ZhoBLiMP row: ' + line);
      const values = match[2].trim().replaceAll('−', '-').split(/\s+/).map(Number);
      if (values.length !== 9 || !values.every(Number.isFinite)) throw new Error('Invalid scores for ' + match[1]);
      const label = match[1].trim();
      if (label.startsWith('OVERALL')) {
        const setting = label.slice(7);
        models.forEach((model, i) => rows.push({ model, setting, score: values[i], metrics: setting === 'SLLN-LP' ? metrics[i] : undefined }));
      } else {
        const key = label.toLowerCase().replace(/[^a-z]+/g, '_').replace(/_$/, '');
        parts[key] = label;
        metrics.forEach((m, i) => { m[key] = values[i]; });
      }
    }
    if (Object.keys(parts).length !== 15) throw new Error('Missing ZhoBLiMP phenomena');
    board.parts = parts;
    return checked(rows, 21);
  },
};
export default board;
