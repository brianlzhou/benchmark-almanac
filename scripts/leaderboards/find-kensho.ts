// FIND tests whether models locate and describe inconsistencies in documents.
// Table 5 reports the average task score across five document sources, with evidence and description scores.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.findings-acl.1675.pdf';
const sources = ['BLS', 'PRE', 'SEC', 'EMM', 'PG', 'AVG'];
const measures = ['Evidence score', 'Description score', 'Task score'];
const board: Leaderboard = {
  benchmark: 'find-kensho', static: 'paper', url: 'https://aclanthology.org/2026.findings-acl.1675/', feed,
  terms: 'ACL Anthology publishes the paper under its terms at https://aclanthology.org/2026.findings-acl.1675/.',
  aliases: { 'sonnet-v4': 'claude-sonnet-4', 'gemma-3-12b-it': 'gemma-3-12b', 'gemma-3-27b-it': 'gemma-3-27b' },
  parts: Object.fromEntries(sources.slice(0, -1).map(name => [name, name])),
  stats: Object.fromEntries(measures.slice(0, 2).flatMap(name => sources.map(source =>
    [source + ': ' + name, { name: source + ': ' + name, unit: '%', better: 'higher' }]))),
  async fetch() {
    const text = await pdfText(feed);
    const caption = text.indexOf('Table 5: Evidence, description, and task scores');
    const start = text.lastIndexOf('Evidence Score (', caption);
    const [title, columns, ...lines] = text.slice(start, caption).trim().split('\n');
    if (start < 0 || !title.includes('Description Score') || !title.includes('Task Score') ||
        columns.trim().split(/\s+/).join(' ') !== ['Model', ...sources, ...sources, ...sources].join(' ')) throw new Error('Missing FIND Table 5 columns');
    const rows = lines.filter(line => line.trim()).map(line => {
      const [model, ...cells] = line.trim().split(/\s+/);
      if (cells.length !== 18 || !cells.every(v => /^\d+$/.test(v))) throw new Error('Invalid FIND result: ' + model);
      const metrics: Record<string, number> = {};
      measures.forEach((measure, m) => sources.forEach((source, s) => {
        if (m !== 2 || source !== 'AVG') metrics[m === 2 ? source : source + ': ' + measure] = Number(cells[m * 6 + s]);
      }));
      return { model, score: Number(cells[17]), metrics };
    });
    return checked(rows, 11);
  },
};
export default board;
