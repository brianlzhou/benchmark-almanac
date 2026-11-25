// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CMRC tests Chinese reading comprehension. Tables 2 and 3 report test accuracy on cloze and user questions.
// The paper gives both test results for two named neural readers. Participant standings name teams only.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/L18-1431.pdf';
const board: Leaderboard = {
  benchmark: 'cmrc-2017', url: 'https://aclanthology.org/L18-1431/', feed, static: 'paper',
  headline: 'Plain mean of the Cloze Track and User Query Track accuracy scores.',
  terms: 'ACL Anthology terms apply to the attributed paper. https://aclanthology.org/faq/copyright/',
  parts: { cloze: 'Cloze Track', userQuery: 'User Query Track' },
  async fetch() {
    const paper = await pdfText(feed);
    const cloze = paper.split('Single Model').at(1)?.split('Table 2:')[0];
    const userQuery = paper.split('Table 2:')[1]?.split('Table 3:')[0];
    if (!cloze?.includes('Test') || !userQuery?.includes('Validation')) throw new Error('CMRC results tables changed');
    const rows = ['AS Reader', 'AoA Reader'].map(model => {
      const a = cloze.match(new RegExp('Baseline - ' + model + ' \\(default settings\\)\\s+[\\d.]+\\s+([\\d.]+)'));
      const b = userQuery.match(new RegExp('Baseline - ' + model + '\\s+-\\s+([\\d.]+)'));
      if (!a || !b) throw new Error('Missing reader in CMRC tables: ' + model);
      const metrics = { cloze: Number(a[1]), userQuery: Number(b[1]) };
      return { model, score: (metrics.cloze + metrics.userQuery) / 2, metrics };
    });
    return checked(rows, 2);
  },
};
export default board;
