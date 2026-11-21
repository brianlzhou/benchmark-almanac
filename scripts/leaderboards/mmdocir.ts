// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// MMDocIR tests retrieval of pages and layout elements. Tables 5 and 6 report macro and micro recall plus scores for ten domains.
// Use macro Recall@1, the first average at the first cutoff in each table.
import type { BoardPart, Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://aclanthology.org/2025.emnlp-main.1576.pdf';
const columns = ['Research Report', 'Administration and Industry', 'Tutorial and Workshop', 'Academic Paper',
  'Brochure', 'Finance Report', 'Guidebook', 'Government', 'Laws', 'News', 'Macro', 'Micro'];
const sections = [
  { task: 'Page', caption: 'Table 5: Main results for page-level retrieval', cutoffs: [1, 3, 5] },
  { task: 'Layout', caption: 'Table 6: Main results for layout-level retrieval', cutoffs: [1, 5, 10] },
];
const parts: Record<string, BoardPart> = {};
for (const { task, cutoffs } of sections) {
  for (const k of cutoffs) for (const name of columns) {
    const group = task + ' Recall@' + k;
    parts[group + ' ' + name] = { name, group };
  }
}
const board: Leaderboard = {
  benchmark: 'mmdocir', url: 'https://aclanthology.org/2025.emnlp-main.1576/', feed, static: 'paper', parts,
  headline: 'This is the plain mean of macro Recall@1 on page retrieval and layout retrieval.',
  terms: 'ACL Anthology lists the publication terms at https://aclanthology.org/faq/copyright/.',
  async fetch() {
    const paper = await pdfText(feed);
    const models = new Map<string, Record<string, number>>();
    for (const { task, caption, cutoffs } of sections) {
      const end = paper.indexOf(caption);
      const table = paper.slice(paper.lastIndexOf('\f', end), end);
      if (end < 0 || !/Domain\s+Resear\. Admin Tutori\.& Acade\. Broch- Finance Guide- Govern- Laws\s+News\s+Average/.test(table) ||
        !/Macro\s+Micro/.test(table)) throw new Error('Missing MMDocIR header for ' + task);
      const groups = [...table.matchAll(/Recall@k = (\d+)/g)].map(m => Number(m[1]));
      if (groups.join('|') !== cutoffs.join('|')) throw new Error('Changed recall cutoffs for ' + task);
      const records = [...table.matchAll(/^\s*(\S+)[ \t]+((?:\d+\.\d+[ \t]+){11}\d+\.\d+)[ \t]*$/gm)];
      if (records.length !== 33) throw new Error('Missing MMDocIR model rows for ' + task);
      records.forEach(([, raw, numbers], i) => {
        const model = raw.replace(/ours$/, '');
        const metrics = models.get(model) ?? {};
        const prefix = task + ' Recall@' + cutoffs[Math.floor(i / 11)] + ' ';
        if (prefix + 'Macro' in metrics) throw new Error('Repeated recall block for ' + model);
        const values = numbers.split(/\s+/).map(numberCell);
        columns.forEach((name, j) => { metrics[prefix + name] = values[j]; });
        models.set(model, metrics);
      });
    }
    return checked([...models].map(([model, metrics]) => {
      if (Object.keys(metrics).length !== 72) throw new Error('Incomplete recall blocks for ' + model);
      return { model, metrics, score: (metrics['Page Recall@1 Macro'] + metrics['Layout Recall@1 Macro']) / 2 };
    }), 11);
  },
};
export default board;
